const { initializeApp, cert } = require("firebase-admin/app");
const {
  getFirestore,
  FieldValue,
} = require("firebase-admin/firestore");

const XLSX = require("xlsx");
const path = require("path");

// ==================================================
// 1. FIREBASE ADMIN SETUP
// ==================================================

const serviceAccount = require("../firebase-service-account.json");

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();


// ==================================================
// 2. EXCEL FILE
// ==================================================

const excelPath = path.join(
  __dirname,
  "..",
  "products.xlsx.xlsx"
);

const workbook = XLSX.readFile(excelPath);

console.log("\n======================================");
console.log("CRACKER STORE IMPORT");
console.log("======================================\n");

console.log("Excel sheets found:");

console.log(workbook.SheetNames);


// ==================================================
// 3. HELPER FUNCTIONS
// ==================================================

function cleanText(value) {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
}


function toNumber(value) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return 0;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}


function createProductId(serialNumber) {
  return `product-${String(serialNumber).padStart(3, "0")}`;
}


// ==================================================
// 4. IMPORT INDIVIDUAL PRODUCTS
// ==================================================

async function importProducts() {
  console.log("\n======================================");
  console.log("IMPORTING INDIVIDUAL PRODUCTS");
  console.log("======================================\n");

  const sheet =
    workbook.Sheets["Individual Item List"];

  if (!sheet) {
    throw new Error(
      'Sheet "Individual Item List" was not found.'
    );
  }

  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
  });

  let importedCount = 0;

  /*
    Firestore batches have a limit of 500 writes.

    We have around 189 products, so one batch is
    currently enough.

    We still keep the batch size logic here so that
    the importer is safer if you later have more
    products.
  */

  let batch = db.batch();
  let batchCount = 0;

  async function commitBatch() {
    if (batchCount === 0) {
      return;
    }

    await batch.commit();

    batch = db.batch();
    batchCount = 0;
  }


  /*
    Your Excel sheet has:

    Row 0 → title
    Row 1 → headings
    Row 2 onwards → products
  */

  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];

    const serialNumber = row[0];

    const name = cleanText(row[1]);

    const unit = cleanText(row[2]);

    const category = cleanText(row[3]);

    const price = toNumber(row[4]);


    // Ignore empty rows
    if (!serialNumber || !name) {
      continue;
    }


    const productId =
      createProductId(serialNumber);


    const productRef = db
      .collection("products")
      .doc(productId);


    const productData = {
      id: productId,

      name: name,

      category:
        category || "Uncategorized",

      unit: unit,

      price: price,

      /*
        Your Excel file does not contain
        actual inventory stock.

        We will set the real stock later
        from the admin dashboard.
      */
      stock: 50,

      active: true,

      source: "products.xlsx",

      excelSerialNumber:
        Number(serialNumber),

      createdAt:
        FieldValue.serverTimestamp(),

      updatedAt:
        FieldValue.serverTimestamp(),
    };


    batch.set(
      productRef,
      productData,
      {
        merge: true,
      }
    );


    batchCount++;

    importedCount++;


    console.log(
      `${productId} | ${name} | ₹${price}`
    );


    /*
      Commit every 450 products instead of
      waiting for the 500-write Firestore limit.
    */

    if (batchCount >= 450) {
      await commitBatch();
    }
  }


  // Commit remaining products
  await commitBatch();


  console.log(
    `\nProducts imported: ${importedCount}`
  );


  return importedCount;
}


// ==================================================
// 5. FIND PACK PRICE
// ==================================================

function findPackPrice(rows) {
  for (const row of rows) {
    for (const cell of row) {
      const text = cleanText(cell);

      if (!text) {
        continue;
      }


      /*
        Looks for:

        INR 3,400
        INR 6300
        INR 6,300/-
      */

      const match = text.match(
        /INR\s*([\d,]+)/
      );


      if (match) {
        return Number(
          match[1].replace(/,/g, "")
        );
      }
    }
  }


  return 0;
}


// ==================================================
// 6. IMPORT A PACK
// ==================================================

async function importPack(
  sheetName,
  packId,
  defaultPackName,
  defaultPackPrice
) {
  console.log("\n======================================");

  console.log(
    `IMPORTING PACK: ${sheetName}`
  );

  console.log("======================================\n");


  const sheet =
    workbook.Sheets[sheetName];


  if (!sheet) {
    console.log(
      `WARNING: Sheet "${sheetName}" not found.`
    );

    return;
  }


  const rows = XLSX.utils.sheet_to_json(
    sheet,
    {
      header: 1,
      defval: null,
    }
  );


  // ------------------------------------------
  // Find the pack price
  // ------------------------------------------

  const detectedPrice =
    findPackPrice(rows);


  const packPrice =
    detectedPrice || defaultPackPrice;


  // ------------------------------------------
  // Find table header
  // ------------------------------------------

  let headerRowIndex = -1;


  for (
    let i = 0;
    i < rows.length;
    i++
  ) {
    const row = rows[i];


    const hasSerialNumber =
      row.some(
        (cell) =>
          cleanText(cell)
            .toLowerCase()
            .replace(/\s/g, "") ===
          "s.no."
      );


    if (hasSerialNumber) {
      headerRowIndex = i;
      break;
    }
  }


  if (headerRowIndex === -1) {
    console.log(
      `WARNING: Could not find product table in ${sheetName}.`
    );

    return;
  }


  // ------------------------------------------
  // Read pack items
  // ------------------------------------------

  const items = [];


  for (
    let i = headerRowIndex + 1;
    i < rows.length;
    i++
  ) {
    const row = rows[i];


    const serialNumber = row[0];

    const itemName =
      cleanText(row[1]);

    const unit =
      cleanText(row[2]);

    const quantity =
      toNumber(row[3]);


    if (
      !serialNumber ||
      !itemName
    ) {
      continue;
    }


    items.push({
      serialNumber:
        Number(serialNumber),

      name: itemName,

      unit: unit,

      quantity: quantity,
    });
  }


  // ------------------------------------------
  // Create Firestore pack
  // ------------------------------------------

  const packRef = db
    .collection("packs")
    .doc(packId);


  const packData = {
    id: packId,

    name: defaultPackName,

    price: packPrice,

    active: true,

    items: items,

    source: "products.xlsx.xlsx",

    createdAt:
      FieldValue.serverTimestamp(),

    updatedAt:
      FieldValue.serverTimestamp(),
  };


  await packRef.set(
    packData,
    {
      merge: true,
    }
  );


  console.log(
    `Pack name: ${defaultPackName}`
  );

  console.log(
    `Pack price: ₹${packPrice}`
  );

  console.log(
    `Items in pack: ${items.length}`
  );

  console.log(
    `Firestore ID: ${packId}`
  );
}


// ==================================================
// 7. MAIN IMPORT FUNCTION
// ==================================================

async function main() {
  try {

    // ------------------------------------------
    // Import individual products
    // ------------------------------------------

    const productCount =
      await importProducts();


    // ------------------------------------------
    // Import ₹3,400 pack
    // ------------------------------------------

    await importPack(
      "3400-Classic Children's Pack",

      "classic-childrens-pack",

      "Classic Children's Pack",

      3400
    );


    // ------------------------------------------
    // Import ₹6,300 pack
    // ------------------------------------------

    await importPack(
      "6300-Fancy Family Pack",

      "fancy-family-pack",

      "Fancy Family Pack",

      6300
    );


    // ------------------------------------------
    // Finished
    // ------------------------------------------

    console.log("\n======================================");

    console.log("IMPORT COMPLETE!");

    console.log("======================================\n");


    console.log(
      `Individual products: ${productCount}`
    );

    console.log(
      "Packs: 2"
    );


    console.log("\nFirestore:");

    console.log(`
products/
    product-001
    product-002
    product-003
    ...

packs/
    classic-childrens-pack
    fancy-family-pack
`);


    console.log(
      "\nYour Excel data has been imported successfully."
    );


  } catch (error) {

    console.error("\n======================================");

    console.error("IMPORT FAILED");

    console.error("======================================\n");

    console.error(error);

    process.exit(1);
  }
}


// ==================================================
// 8. START
// ==================================================

main();