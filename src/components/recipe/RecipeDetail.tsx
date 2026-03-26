import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { difficultyLabel } from "@/lib/utils"
import { ArrowLeft, Gauge, Clock, Users, Carrot, ListOrdered } from "lucide-react"
import type { Recipe, Tag } from "@/db/schema"

interface RecipeDetailProps {
  recipe: Recipe
  tags?: Tag[]
  backLink: { href: string; label: string }
}

export function RecipeDetail({ recipe, tags, backLink }: RecipeDetailProps) {
  return (
    <div className="max-w-lg mx-auto pb-8">
      <div className="mb-4">
        <Link href={backLink.href} className="text-orange-500 hover:underline flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />{backLink.label}
        </Link>
      </div>

      {recipe.coverImage && (
        <img
          src={recipe.coverImage}
          alt={recipe.title}
          className="w-full h-60 object-cover rounded-lg"
        />
      )}

      <h1 className="text-2xl font-bold mt-4">{recipe.title}</h1>

      <div className="flex flex-wrap gap-2 mt-3">
        <Badge variant="secondary" className="flex items-center gap-1">
          <Gauge className="h-3 w-3" />{difficultyLabel(recipe.difficulty)}
        </Badge>
        {recipe.cookTime && (
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />{recipe.cookTime} 分钟
          </Badge>
        )}
        {recipe.servings && (
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3 w-3" />{recipe.servings} 人份
          </Badge>
        )}
        {tags?.map((tag) => (
          <Badge
            key={tag.id}
            variant="outline"
            className="border-0"
            style={{ backgroundColor: tag.color + "22", color: tag.color }}
          >
            {tag.name}
          </Badge>
        ))}
      </div>

      {recipe.description && (
        <p className="text-gray-600 mt-2">{recipe.description}</p>
      )}

      {recipe.ingredients?.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mt-6 mb-2 flex items-center gap-1.5">
            <Carrot className="h-4 w-4 text-orange-500" />食材
          </h2>
          <ul className="divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
            {recipe.ingredients.map((ingredient, index) => (
              <li key={index} className="flex justify-between px-4 py-2 bg-white">
                <span>{ingredient.name}</span>
                <span className="text-gray-500">
                  {ingredient.amount} {ingredient.unit}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {recipe.steps?.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mt-6 mb-2 flex items-center gap-1.5">
            <ListOrdered className="h-4 w-4 text-orange-500" />步骤
          </h2>
          <ol className="space-y-4">
            {recipe.steps.map((step) => (
              <li key={step.order} className="flex gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-medium">
                  {step.order}
                </span>
                <div className="flex-1">
                  <p>{step.content}</p>
                  {step.imageUrl && (
                    <img
                      src={step.imageUrl}
                      alt={`步骤 ${step.order}`}
                      className="mt-2 w-full rounded-lg object-cover"
                    />
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  )
}
