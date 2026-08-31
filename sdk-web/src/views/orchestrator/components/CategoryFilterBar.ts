export interface CategoryFilterBarProps {
  categories: string[]
  selectedCategory?: string
  onSelectCategory?: (category: string) => void
}

export class CategoryFilterBar {
  constructor(private readonly props: CategoryFilterBarProps) {}

  handleSelect(category: string): void {
    if (this.props.onSelectCategory) {
      this.props.onSelectCategory(category)
    }
  }

  render(): string {
    const pillsHtml = this.props.categories
      .map(
        (cat) =>
          `<button class="filter-pill ${cat === (this.props.selectedCategory || 'ALL') ? 'active' : ''}"
                   data-category="${cat}"
                   onclick="void(0)">
            ${cat}
          </button>`
      )
      .join('\n')

    return `
      <div class="swimlane-category-filter-bar">
        <span class="filter-label">Lanes:</span>
        <div class="pills-container">
          ${pillsHtml}
        </div>
      </div>
    `.trim()
  }
}
