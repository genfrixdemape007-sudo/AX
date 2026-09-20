export default function CategoryFilter({ categories, activeId, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button
        onClick={() => onChange(null)}
        className={`chip shrink-0 ${activeId === null ? 'chip-active' : ''}`}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onChange(category.id)}
          className={`chip shrink-0 ${activeId === category.id ? 'chip-active' : ''}`}
        >
          {category.icon && (
            <span className="mr-1" aria-hidden="true">
              {category.icon}
            </span>
          )}
          {category.name}
        </button>
      ))}
    </div>
  )
}
