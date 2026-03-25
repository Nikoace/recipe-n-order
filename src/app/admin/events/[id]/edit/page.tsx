import { notFound } from "next/navigation"
import { getEventById, getEventRecipes } from "@/db/queries/events"
import { EventForm } from "@/components/event/EventForm"

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const numId = Number(id)
  if (isNaN(numId)) notFound()

  const event = await getEventById(numId)
  if (!event) notFound()
  if (event.status !== "draft") notFound()

  const eventRecipes = await getEventRecipes(numId)
  const recipeIds = eventRecipes.map((r) => r.recipe.id)

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">编辑活动</h1>
      <EventForm
        mode="edit"
        eventId={numId}
        defaultTitle={event.title}
        defaultDate={event.date}
        defaultRecipeIds={recipeIds}
      />
    </div>
  )
}
