import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";

import { db } from "./firebase";

export type Product = {
  id: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  stock: number;
  active: boolean;
  imageUrl?: string;
};

export async function getProducts(): Promise<Product[]> {
  const productsRef = collection(db, "products");

  const productsQuery = query(
    productsRef,
    orderBy("excelSerialNumber", "asc")
  );

  const snapshot = await getDocs(productsQuery);

  return snapshot.docs.map((doc) => {
    const data = doc.data();

    return {
      id: doc.id,
      name: data.name ?? "",
      category: data.category ?? "Uncategorized",
      unit: data.unit ?? "",
      price: data.price ?? 0,
      stock: data.stock ?? 0,
      active: data.active ?? true,
      imageUrl: data.imageUrl ?? "",
    };
  });
}