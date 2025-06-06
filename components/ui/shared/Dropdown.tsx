import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"

  import { startTransition, useEffect, useState } from "react"
  import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"
 
  import { createCategory, getAllCategories } from "@/lib/actions/category.actions"
import { Input } from "../input"
import { ICategory } from "@/lib/mongodb/database/models/category.model"
  
  type DropdownProps = {
    value?: string
    onChangeHandler?: (value: string) => void
  }
  
  const Dropdown = ({ value, onChangeHandler }: DropdownProps) => {
    const [categories, setCategories] = useState<ICategory[]>([])
    const [newCategory, setNewCategory] = useState('');
  
    const handleAddCategory = () => {
      createCategory({
        categoryName: newCategory.trim()
      })
        .then((category) => {
          setCategories((prevState) => [...prevState, category])
        })
    }
  
    useEffect(() => {
      const getCategories = async () => {
        const categoryList = await getAllCategories();
  
        categoryList && setCategories(categoryList as ICategory[])
      }
  
      getCategories();
    }, [])
  
    return (
      <Select onValueChange={onChangeHandler} defaultValue={value}>
        <SelectTrigger className="select-field">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          {categories.length > 0 && categories.map((category) => (
            <SelectItem key={category._id} value={category._id} className="select-item p-regular-14">
              {category.name}
            </SelectItem>
          ))}
  
          <AlertDialog>
            <AlertDialogTrigger className="p-medium-14 flex w-full rounded-sm py-3 pl-8 text-primary-500 hover:bg-primary-50 focus:text-primary-500">Add new category</AlertDialogTrigger>
            <AlertDialogContent className="bg-white">
              <AlertDialogHeader>
                <AlertDialogTitle>New Category</AlertDialogTitle>
                <AlertDialogDescription>
                  <Input 
                    type="text" 
                    placeholder="Category name" 
                    className="input-field mt-3" 
                    onChange={(e) => setNewCategory(e.target.value)}
                    value={newCategory}
                  />
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setNewCategory('')}>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => {
                    startTransition(handleAddCategory)
                    setNewCategory('')
                  }}
                >
                  Add
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </SelectContent>
      </Select>
    )
  }
  
  export default Dropdown
