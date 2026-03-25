import { EventForm } from "@/components/event/EventForm"

export default function NewEventPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">新建聚餐活动</h1>
      <EventForm mode="create" />
    </div>
  )
}
