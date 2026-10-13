const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const XLSX = require("xlsx");
const path = require("path");

const serviceAccount = require("../firebase-service-account.json");

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

async function checkProducts() {
  const excelPath = path.join(__dirname, "..", "products.xlsx.xlsx");

  const workbook = XLSX.readFile(excelPath);

  const sheet = workbook.Sheets["Individual Item List"];

  if (!sheet) {
    throw new Error('Could not find "Individual Item List" sheet.');
  }

  // Read every row as an array.
  // Row 1 = title
  // Row 2 = column headers
  // Remaining rows = products + category headings
  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
  });

  // A real product has a numeric S.No. in column A.
  const excelProducts = rows
    .slice(2)
    .filter(
      (row) =>
        typeof row[0] === "number" &&
        row[1] !== ""
    )
    .map((row) => ({
      serial: row[0],
      name: String(row[1]).trim(),
      unit: String(row[2]).trim(),
      category: String(row[3]).trim(),
      price: Number(row[4]) || 0,
    }));

  // Get products from Firestore
  const snapshot = await db.collection("products").get();

  const firestoreProducts = snapshot.docs.map((doc) => ({
    id: doc.id,
    name: String(doc.data().name || "").trim(),
    serial: doc.data().excelSerialNumber,
  }));

  console.log("\n==============================");
  console.log("PRODUCT COUNT");
  console.log("==============================");

  console.log(`Excel products:      ${excelProducts.length}`);
  console.log(`Firestore products:  ${firestoreProducts.length}`);

  // Compare product names
  const firestoreNames = new Set(
    firestoreProducts.map((product) =>
      product.name.toLowerCase()
    )
  );

  const missing = excelProducts.filter(
    (product) =>
      !firestoreNames.has(product.name.toLowerCase())
  );

  console.log("\n==============================");
  console.log(`MISSING FROM FIRESTORE: ${missing.length}`);
  console.log("==============================");

  if (missing.length === 0) {
    console.log("No products are missing!");
  } else {
    missing.forEach((product) => {
      console.log(
        `${product.serial} | ${product.name} | ₹${product.price}`
      );
    });
  }

  console.log("\n==============================");
  console.log("DONE");
  console.log("==============================\n");
}

checkProducts().catch((error) => {
  console.error("\nERROR:");
  console.error(error);
  process.exit(1);
});