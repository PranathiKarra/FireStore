import { getProducts } from "@/lib/products";
import Storefront from "./Storefront";

export default async function Home() {
  const products = await getProducts();

  return <Storefront products={products} />;
}