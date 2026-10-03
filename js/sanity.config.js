import { createClient } from "https://esm.sh/@sanity/client@6";
import imageUrlBuilder from "https://esm.sh/@sanity/image-url@1";

const projectId = "ehmw6xk5";
const dataset = "production";
const apiVersion = "2026-05-08";

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  perspective: "published",
});

const builder = imageUrlBuilder(sanityClient);

export const urlFor = (source) => builder.image(source);

export const DISHES_BY_CATEGORY_QUERY = `
  *[
    _type == "dish" &&
    coalesce(published, true) == true &&
    category == $category &&
    coalesce(available, true) == true
  ] | order(coalesce(sortOrder, 9999) asc, name asc) {
    _id,
    name,
    description,
    price,
    category,
    allergens,
    available,
    sortOrder,
    image,
    "imageUrl": image.asset->url
  }
`;

