# Design system

The public site uses a spacious editorial fintech layout: navy typography, blue actions, fine borders, a pale hero, and an HTML/CSS dashboard illustration explicitly labelled as illustrative. No live customer statistics, testimonials, partner logos, prices, or legal policies are invented.

Application screens use slate backgrounds, white cards, a dark sidebar, compact financial tables, and a consistent title/action hierarchy. System fonts ensure no network font dependency. Spacing follows 4/8px increments. Controls are at least 42–44px, with larger mobile actions. Cards use 10–13px corners and restrained shadows.

CSS variables `--primary`, `--secondary`, and corresponding foreground variables derive from verified public tenant branding. Invalid colors fall back to blue #2563EB / teal #0D9488. A luminance calculation chooses white/black for readable primary button text. Status colors retain semantic text and a status dot, independent of tenant branding.

Shared components: Button variants, Card, money/date/password/select/textarea fields, validated Form, Alert, ErrorPanel, Loading, Empty, Badge, Table, Pagination, Tabs, Modal, Confirm, OnlineState, transient Toast feedback, and Skeleton. Radix dialogs provide focus management, escape handling, accessible title/description and focus restoration. Async submits use a synchronous lock as well as disabled states. Tables scroll in their own container. Labels and field errors are explicit; inputs accept password managers. Reduced-motion preferences disable animation. Receipts have a dedicated print stylesheet.

Responsive breakpoints at 767/900/1200px adapt landing composition, workspace metrics, forms and sidebars. Browser tests verify 360/768/1024/1440px. Mobile navigation uses a drawer with labelled open/close controls; dense tables retain deliberate horizontal scrolling. Loading/error/empty states reserve sensible layout space.

Styles are compiled through the [official Tailwind Vite plugin](https://tailwindcss.com/docs/installation/using-vite). Application-specific CSS extends that foundation to keep component styling coherent.
