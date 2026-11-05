
export * from "./categoryController.js";
export * from "./brandController.js";

import { seedCategoryDefaults } from "./categoryController.js";
import { seedBrandDefaults } from "./brandController.js";


export const seedCatalogDefaults = async () => {
  await seedCategoryDefaults();
  await seedBrandDefaults();
};
