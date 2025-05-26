"use server"

import { CreateCategoryParams } from "@/types"
import { connectToDatabase } from "../mongodb/database";
import Category from "../mongodb/database/models/category.model";

export const createCategory = async ({ categoryName }: CreateCategoryParams) => {
  try {
    await connectToDatabase();

    const newCategory = await Category.create({ name: categoryName });
    return JSON.parse(JSON.stringify(newCategory));
  } catch (error) {
    console.error('Error in createCategory:', error);
    return null;
  }
}

export const getAllCategories = async () => {
  try {
    await connectToDatabase();

    const categories = await Category.find();
    return JSON.parse(JSON.stringify(categories || []));
  } catch (error) {
    console.error('Error in getAllCategories:', error);
    return [];
  }
}
