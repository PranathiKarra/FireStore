const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const serviceAccount = require("../firebase-service-account.json");

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

async function setTestStock() {
  const snapshot = await db.collection("products").get();

  const batch = db.batch();

  snapshot.forEach((doc) => {
    batch.update(doc.ref, {
      stock: 50,
    });
  });

  await batch.commit();

  console.log(`Updated ${snapshot.size} products with test stock = 50`);
}

setTestStock().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});