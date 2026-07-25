export type ProductStatus = 'sample' | 'verified';

export interface GoveeProduct {
  id: string;
  name: string;
  family: 'Permanent Outdoor Lights' | 'Permanent Outdoor Lights Pro' | 'String Lights';
  lengthFeet: number;
  modelNumber: string;
  generation: 1 | 2 | 3;
  color: 'White' | 'Black';
  retailPrice: number;
  dataStatus: ProductStatus;
}

export const SAMPLE_PRODUCTS: GoveeProduct[] = [
  {
    id: 'prod-pol-50-w-1',
    name: 'Govee Permanent Outdoor Lights (50ft, White)',
    family: 'Permanent Outdoor Lights',
    lengthFeet: 50,
    modelNumber: 'H705A',
    generation: 1,
    color: 'White',
    retailPrice: 199.99,
    dataStatus: 'sample'
  },
  {
    id: 'prod-pol-100-w-1',
    name: 'Govee Permanent Outdoor Lights (100ft, White)',
    family: 'Permanent Outdoor Lights',
    lengthFeet: 100,
    modelNumber: 'H705B',
    generation: 1,
    color: 'White',
    retailPrice: 299.99,
    dataStatus: 'sample'
  },
  {
    id: 'prod-pol-150-w-1',
    name: 'Govee Permanent Outdoor Lights (150ft, White)',
    family: 'Permanent Outdoor Lights',
    lengthFeet: 150,
    modelNumber: 'H705C',
    generation: 1,
    color: 'White',
    retailPrice: 399.99,
    dataStatus: 'sample'
  },
  {
    id: 'prod-pol-pro-100-b-1',
    name: 'Govee Permanent Outdoor Lights Pro (100ft, Black)',
    family: 'Permanent Outdoor Lights Pro',
    lengthFeet: 100,
    modelNumber: 'H706B',
    generation: 1,
    color: 'Black',
    retailPrice: 399.99,
    dataStatus: 'sample'
  },
  {
    id: 'prod-pol-pro-150-w-1',
    name: 'Govee Permanent Outdoor Lights Pro (150ft, White)',
    family: 'Permanent Outdoor Lights Pro',
    lengthFeet: 150,
    modelNumber: 'H706C',
    generation: 1,
    color: 'White',
    retailPrice: 499.99,
    dataStatus: 'sample'
  }
];

export function recommendKits(linearFeet: number): GoveeProduct[] {
  // Pure function that recommends sample products based on feet
  if (linearFeet <= 0 || isNaN(linearFeet)) return [];
  
  const recommended: GoveeProduct[] = [];
  let remainingFeet = linearFeet;
  
  while (remainingFeet > 0) {
    if (remainingFeet >= 125) {
      const product = SAMPLE_PRODUCTS.find(p => p.lengthFeet === 150 && p.family === 'Permanent Outdoor Lights');
      if (product) recommended.push(product);
      remainingFeet -= 150;
    } else if (remainingFeet >= 75) {
      const product = SAMPLE_PRODUCTS.find(p => p.lengthFeet === 100 && p.family === 'Permanent Outdoor Lights');
      if (product) recommended.push(product);
      remainingFeet -= 100;
    } else {
      const product = SAMPLE_PRODUCTS.find(p => p.lengthFeet === 50 && p.family === 'Permanent Outdoor Lights');
      if (product) recommended.push(product);
      remainingFeet -= 50;
    }
  }
  
  return recommended;
}
