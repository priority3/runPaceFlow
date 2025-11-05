### UI/UX Guidelines
- follow the [tailwindcss-uikit-color]( https://github.com/Innei/apple-uikit-colors,)
- Use Apple UIKit color system via tailwind-uikit-colors package
- Prefer semantic color names: `text-primary`, `fill-secondary`, `material-thin`, etc.
- Follow system colors: `red`, `blue`, `green`, `mint`, `teal`, `cyan`, `indigo`, `purple`, `pink`, `brown`, `gray`
- Use material design principles with opacity-based fills and proper contrast

### i18n Writing Guidelines

1. Follow [i18next formatting guidelines](https://www.i18next.com/translation-function/formatting)
2. **Use flat keys only** - Use `.` notation for separation, no nested objects
3. For plural-sensitive languages, use `_one` and `_other` suffixes
4. **Avoid conflicting flat keys** - During build, flat dot-separated keys (e.g., 'exif.custom.rendered.custom') are automatically converted to nested objects, which can cause conflicts. 

Example:
```json
{
  "personalize.title": "Personalization",
  "personalize.prompt.label": "Personal Prompt",
  "shortcuts.add": "Add Shortcut",
  "shortcuts.validation.required": "Name and prompt are required"
}
```
