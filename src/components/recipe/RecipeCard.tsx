import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { difficultyLabel, cn } from "@/lib/utils"
import { UtensilsCrossed, Gauge, Clock } from "lucide-react"
import type { RecipeWithTags } from "@/db/queries/recipes"

interface RecipeCardProps {
  recipe: RecipeWithTags
  href?: string
  actions?: React.ReactNode
  className?: string
}

export function RecipeCard({ recipe, href, actions, className }: RecipeCardProps) {
  const visibleTags = recipe.tags.slice(0, 3)
  const extraCount = recipe.tags.length - visibleTags.length

  const cardContent = (
    <>
      {recipe.coverImage ? (
        <img
          src={recipe.coverImage}
          alt={recipe.title}
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className="w-full h-48 bg-orange-50 flex items-center justify-center">
          <UtensilsCrossed className="h-12 w-12 text-orange-300" />
        </div>
      )}
      <div className="p-4">
        <h2 className="font-semibold text-lg leading-snug">{recipe.title}</h2>

        <div className="flex gap-2 mt-1.5 flex-wrap">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Gauge className="h-3 w-3" />{difficultyLabel(recipe.difficulty)}
          </Badge>
          {recipe.cookTime != null && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />{recipe.cookTime} 分钟
            </Badge>
          )}
          {visibleTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ backgroundColor: tag.color + "22", color: tag.color }}
            >
              {tag.name}
            </span>
          ))}
          {extraCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
              +{extraCount}
            </span>
          )}
        </div>

        {recipe.description && (
          <p className="mt-2 text-sm text-gray-500 line-clamp-2">{recipe.description}</p>
        )}

        {actions && <div className="flex gap-2 mt-3">{actions}</div>}
      </div>
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        className={cn("border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow block", className)}
      >
        {cardContent}
      </Link>
    )
  }

  return (
    <div className={cn("border rounded-lg overflow-hidden shadow-sm", className)}>
      {cardContent}
    </div>
  )
}
