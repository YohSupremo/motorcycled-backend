import StoreSettings from "../model/StoreSettings.js";

const DEFAULT_TAX_RATE = 12;

export const getStoreTaxRate = async () => {
  const settings = await StoreSettings.findOne({ key: "primary" }).select("taxRate").lean();
  const taxRate = Number(settings?.taxRate);

  return Number.isFinite(taxRate) && taxRate >= 0 ? taxRate : DEFAULT_TAX_RATE;
};
