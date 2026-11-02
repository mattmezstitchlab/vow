import type { TemplateDef } from '../types'
import { saxTemplate } from './saxophone'
import { djTemplate } from './dj'
import { harpTemplate } from './harp'
import { boothTemplate } from './booth'

export const TEMPLATES: TemplateDef[] = [saxTemplate, djTemplate, harpTemplate, boothTemplate]

export function getTemplate(id: string): TemplateDef | undefined {
  return TEMPLATES.find((t) => t.id === id)
}

export { saxTemplate }
