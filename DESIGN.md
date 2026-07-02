---
name: Auxiliaire
description: Personal auxiliary intelligence design system and product brief
---

# Design System: Auxiliaire

Auxiliaire is a private auxiliary intelligence for one person's attention, memory, work, and daily momentum. It should feel like opening a quiet, beautifully made room where the day becomes understandable. It is not a generic productivity dashboard, not a corporate SaaS tool, not a gamified habit tracker, and not an admin panel with prettier colors.

The product should feel personal, therapeutic, intelligent, and premium. It should help the user feel current, composed, and ready without making them manage another system. Auxiliaire is the supporting presence beside the user: a discreet auxiliary layer that helps carry memory, structure attention, and prepare the next step.

## Name And Brand Idea

Auxiliaire should feel distinctive, not like another common AI productivity name.

The name suggests:

- An assisting presence.
- A second layer of support.
- Something refined, quiet, and capable.
- Help that stays beside the user without taking over.
- A premium personal intelligence rather than a generic assistant.

Design implications:

- Auxiliaire should appear as a named presence throughout the UI.
- The product should never reduce Auxiliaire to a chat widget.
- Avoid mascot behavior, cute avatars, or fake personality theatrics.
- The visual system should feel slightly literary, editorial, and European in restraint.
- The brand should be elegant enough to sit beside personal notes, work decisions, and reflective daily planning.

## North Star

The first screen should answer three questions immediately:

- **Am I clear?** What matters today, what is unresolved, what needs focus?
- **Am I current?** What changed, what arrived, what should I know?
- **Am I ready?** What is the cleanest next action?

Every design decision should reduce anxiety, remove noise, and make the next step feel obvious.

## Brand Feeling

Auxiliaire should feel like:

- A private study at dawn.
- A calm command center for attention.
- A discreet support entity that remembers without overwhelming.
- A soft landing place for thoughts, links, voice notes, unfinished ideas, and decisions.
- A premium personal tool, closer to a beautifully designed journal plus cockpit than a dashboard.

It should not feel like:

- A task manager clone.
- A Notion template.
- A startup landing page.
- A stock AI dashboard.
- A default Tailwind or shadcn screen.
- A wellness app with vague gradients and motivational copy.

## Product Principles

### 1. Start With Readiness

The product opens on the user's state, not on navigation. The main view should summarize today with editorial clarity: focus, open loops, context changes, and suggested next action.

### 2. Capture Without Ceremony

The user should be able to drop anything into the system: a voice note, idea, link, memory, task, question, document, or reminder. Capture must feel frictionless, not like filling a form.

### 3. Knowledge Becomes Action

Notes, readings, meetings, transcripts, and saved links should not become a pile. They should turn into summaries, decisions, reusable knowledge, watchlist items, and review prompts.

### 4. Quiet By Default

The UI should not compete for attention. Avoid excessive badges, notification stacks, chart clutter, heavy outlines, or decorative animation. Visual richness should clarify state, not decorate emptiness.

### 5. Private And Personal

The product speaks to one person. Copy should be direct, useful, and grounded. Avoid corporate tone, fake enthusiasm, productivity guilt, and performative motivation.

### 6. Auxiliaire As Presence

Auxiliaire is not just a chat window. It is present throughout the interface through summaries, suggestions, gentle prompts, and structured outputs. It should feel integrated, ambient, and available, like the product has a second attentive layer running underneath the user's day.

## Visual Direction

The aesthetic should be warm, editorial, calm, and precise.

### Overall Look

- Warm off-white base, never pure white.
- Deep ink panels for high-focus or command-state areas.
- Muted, natural accents used sparingly.
- Soft tonal separation instead of heavy borders.
- Spacious sections with careful alignment.
- Refined typography that feels written and considered.
- Subtle material depth, not glassmorphism.

### Mood Keywords

Use these as design anchors:

- quiet
- composed
- intelligent
- tactile
- editorial
- intimate
- grounded
- premium
- reflective
- precise

Avoid these visual moods:

- playful
- bubbly
- neon
- corporate
- busy
- gamified
- sterile
- futuristic for its own sake
- template-like
- dashboard-heavy

## Color System

Use color like a high-end editorial product: restrained, intentional, and emotional without being sentimental.

### Core Palette

- **Canvas:** warm off-white, bone, paper, soft ivory.
- **Surface:** warm mist, pale stone, soft grey-beige, very light sage.
- **Text:** deep ink, charcoal, softened black, warm graphite.
- **Muted Text:** slate grey, ash, warm grey.
- **Divider:** low-contrast warm grey, no harsh lines.
- **Command:** deep ink or near-black with warmth.
- **Success / Ready:** muted emerald or sage.
- **Attention:** soft amber, never warning-orange unless truly urgent.
- **Emotional / Reflection:** dusty rose or clay, used very sparingly.
- **Information:** muted sky or mineral blue, not default hyperlink blue.

### Color Rules

- Never use pure white backgrounds for the main canvas.
- Never use default browser blue for primary actions.
- Avoid purple gradients, rainbow charts, bright cyan, neon green, or heavy black-white contrast.
- Accent colors should appear in small doses: dots, fine rules, pills, icon states, progress marks.
- Large color fields should be deep ink, warm paper, sage-grey, or soft stone.
- Error states should be calm and specific, not alarming unless data loss or privacy is involved.

## Typography

Typography is one of the main ways the product stops feeling coded.

### Type Personality

- Use a humanist or editorial sans for the main UI.
- Use a calm serif or elegant display face only for rare reflective moments, quotes, or daily framing.
- Avoid generic system-stack appearance if the environment allows better fonts.
- Use type scale deliberately. Do not make everything the same size.

### Hierarchy

- **Page Title:** calm, short, editorial. Example: `Today`, `Readiness`, `Morning Brief`.
- **State Line:** one human sentence that frames the day.
- **Section Labels:** small, quiet, precise. Example: `Open loops`, `Worth knowing`, `Next clean step`.
- **Body Text:** readable, warm, never tiny.
- **Metadata:** small but legible; use muted color, not opacity so low it strains.

### Typography Rules

- Avoid all-caps except tiny metadata labels used sparingly.
- Avoid negative letter spacing.
- Keep line length comfortable.
- Do not use giant hero typography inside operational screens.
- Use sentence case for most labels.
- Text should feel composed, not like placeholder UI copy.

## Spacing And Density

The product should feel dense but breathable.

- Use generous outer margins.
- Use clear vertical rhythm.
- Give capture and Auxiliaire areas more breathing room than lists.
- Lists can be compact, but never cramped.
- Avoid nested cards and stacked boxes.
- Avoid equal-card grids where every item has the same visual weight.
- Use whitespace to show importance.

Good density means the user can scan quickly without feeling shouted at.

## Layout System

### Mobile

Mobile should feel like a pocket companion.

- One primary flow per screen.
- Capture should always be easy to reach.
- Auxiliaire should be one gesture away.
- Today view should prioritize state, next action, and open loops.
- Avoid multi-column mini dashboards on mobile.
- Bottom navigation should be minimal and stable.
- Use large touch targets and calm transitions.

Suggested mobile hierarchy:

1. Readiness state
2. Next clean step
3. Capture
4. Open loops
5. Briefing
6. Review queue

### Desktop

Desktop should become a true command center, not a stretched mobile layout.

- Use the extra space for simultaneous context.
- Keep Auxiliaire, readiness, capture, briefing, and knowledge queue visible.
- Use an editorial cockpit layout rather than a generic grid.
- The center should hold the current focus.
- Side regions should hold Auxiliaire context, watchlist, or queues.
- Avoid making everything a card in a 3-column dashboard.

Suggested desktop structure:

- **Left rail:** calm navigation, capture shortcut, key spaces.
- **Main canvas:** readiness state, focus area, daily brief, next action.
- **Right rail:** Auxiliaire, watchlist, active memory, pending reviews.
- **Lower band:** knowledge queue, patterns, recent captures.

## Navigation

Navigation should feel minimal and personal.

Primary sections:

- Today
- Capture
- Auxiliaire
- Knowledge
- Review
- Watchlist
- Patterns

Rules:

- Navigation should not dominate the product.
- Use icons only if they are thin, consistent, and familiar.
- Labels should be short and human.
- Avoid crowded sidebars with many nested items.
- The user should always know where they are without loud active states.

## Core Surfaces

### Today

Purpose: orient the user.

Must include:

- Readiness state.
- Current focus.
- Open loops from previous days.
- Items that changed since last check.
- One recommended next action.
- Quick capture.

Tone:

- Calm and direct.
- No fake praise.
- No streaks.
- No guilt.

Example copy:

- `You are mostly clear. Two open loops need a decision.`
- `Nothing urgent has changed since last night.`
- `Start with the proposal note. It has the cleanest next step.`

### Auxiliaire

Purpose: help the user think and act.

Auxiliaire should:

- Understand the current screen.
- Offer context-aware suggestions.
- Turn captures into structured notes.
- Summarize long items into decisions and next actions.
- Remember prior commitments and patterns.
- Stay available as a support layer across the product.

Auxiliaire should not:

- Feel like a generic chatbot embed.
- Over-explain itself.
- Use hype or sales language.
- Interrupt too often.
- Act like a mascot or synthetic friend.

Auxiliaire UI:

- Calm writing area.
- Clear distinction between user input, Auxiliaire response, and extracted actions.
- Actions should feel like gentle affordances, not loud buttons.
- Suggested prompts should be sparse and relevant.

### Capture

Purpose: remove friction from saving thoughts.

Capture types:

- Voice note
- Thought
- Link
- Task
- File
- Decision
- Question
- Person or topic to watch

Capture experience:

- One primary input.
- Optional structure after capture, not before.
- Auxiliaire can classify later.
- The user should feel safe dropping incomplete thoughts.

Example states:

- `Captured. I will organize it when you are ready.`
- `This sounds like a follow-up, a note, and one watchlist item.`
- `I found two possible actions inside this.`

### Knowledge Queue

Purpose: prevent saved material from becoming dead storage.

Items should show:

- Title
- Source
- Why it matters
- Current state: unread, summarized, actioned, review later
- Suggested next move

Avoid:

- Giant file lists.
- Raw metadata-heavy rows.
- Generic document cards.

### Review Loops

Purpose: keep knowledge and commitments alive.

Review should include:

- Decisions to revisit.
- Notes that need consolidation.
- Learning prompts.
- People or projects needing follow-up.
- Repeated patterns worth noticing.

Tone:

- Gentle and precise.
- Never school-like.
- Never gamified unless the user asks for it.

### Watchlist

Purpose: track what matters without doomscrolling.

Watchlist can include:

- People
- Projects
- Companies
- Topics
- Risks
- Opportunities
- Open questions

Display:

- Short signal summary.
- What changed.
- Why it matters.
- Suggested action, if any.

### Patterns

Purpose: help the user understand their own rhythm.

Patterns may include:

- Energy
- Focus
- Capture volume
- Unclosed loops
- Decision delay
- Recurring topics
- Deep work windows

Design:

- Gentle charts.
- No rainbow analytics.
- No productivity score shaming.
- Use insight cards sparingly.

## Component Design

### Cards

Cards should be rare and purposeful.

Use cards for:

- Repeated items.
- Focused summaries.
- Captured objects.
- Modal-like decisions.

Avoid:

- Wrapping every section in a card.
- Nested cards.
- Heavy borders and drop shadows.
- Identical cards for items with different importance.

Card feel:

- Soft surface tone.
- Fine divider or very subtle elevation.
- Tight internal hierarchy.
- Clear action area.

### Buttons

Buttons should feel refined and tactile.

Primary:

- Deep ink fill or quiet accent.
- Short label.
- Strong but not loud.

Secondary:

- Text or soft surface button.
- Low visual weight.

Avoid:

- Default blue buttons.
- Over-rounded pill buttons everywhere.
- Too many visible actions at once.

### Inputs

Inputs should feel like writing spaces.

- Soft background.
- No harsh outline.
- Clear focus state.
- Placeholder text should be useful and human.
- Voice capture should feel central, not like an add-on icon.

Example placeholders:

- `Drop a thought, task, link, or question...`
- `Say what is on your mind...`
- `Paste something worth keeping...`

### Pills And Status

Use small, quiet status markers.

Examples:

- `Ready`
- `Needs decision`
- `Waiting`
- `Review later`
- `New signal`
- `Open loop`

Rules:

- Do not overuse badges.
- Status should help scanning, not decorate every item.
- Use muted fills and refined text.

### Lists

Lists should be highly scannable.

- Strong title.
- One-line summary.
- Muted metadata.
- Clear next action if needed.
- Soft separators instead of boxed rows.

### Modals And Sheets

Use modals sparingly.

- Prefer side panels on desktop.
- Prefer bottom sheets on mobile.
- Keep them calm and focused.
- Never create complex forms in modals unless absolutely necessary.

### Charts

Charts should feel editorial and restrained.

- Use one accent at a time.
- Avoid rainbow series.
- Use labels clearly.
- Prefer trend clarity over decorative complexity.
- Avoid analytics dashboards that make the product feel corporate.

## Motion And Interaction

Motion should feel like settling, breathing, focusing, or gently revealing.

Use:

- Soft fades.
- Small vertical shifts.
- Slow focus transitions.
- Subtle loading shimmer only when useful.
- Gentle expansion for structured summaries.

Avoid:

- Bounce.
- Confetti.
- Flashing progress.
- Spinning loaders as the main state.
- Game-like reward animation.
- Over-animated sidebars.

Loading copy:

- `Gathering today's context...`
- `Listening...`
- `Turning this into notes...`
- `Checking what changed...`
- `Finding the cleanest next step...`

## Copy System

The product should sound calm, specific, and useful.

### Voice

- Direct.
- Warm.
- Brief.
- Grounded.
- Intelligent.
- Never performative.

### Good Copy

- `You have three open loops from yesterday.`
- `This looks ready to send.`
- `One thing needs your attention before the day starts.`
- `Captured. I will organize it when you are ready.`
- `Nothing urgent. Start with the cleanest next step.`
- `This can wait. The decision is not needed today.`
- `You saved five items on this topic. I can turn them into one note.`
- `This is still unresolved, but it has not become urgent.`

### Bad Copy

- `Crush your goals today!`
- `Boost your productivity with AI.`
- `Unlock your full potential.`
- `You are falling behind.`
- `Congratulations, you are on a streak!`
- `Optimize your workflow.`
- `Engage with your personalized dashboard.`

## Empty States

Empty states should make the product feel calm, not vacant.

Examples:

- `No open loops. Keep the day light.`
- `Nothing waiting for review.`
- `No new signals. You are current.`
- `Start by capturing one thing you do not want to hold in your head.`

Rules:

- One sentence.
- One action.
- No illustrations unless truly meaningful.
- No generic empty-box icons.

## Accessibility And Legibility

- Maintain strong readability.
- Do not rely only on color for status.
- Touch targets must be comfortable.
- Text contrast must be gentle but sufficient.
- Avoid tiny metadata that becomes decorative.
- Support light and dark modes if possible, but light mode should be the primary emotional reference.

## Implementation Guardrails

To avoid a coded or default look:

- Do not ship unstyled native form controls.
- Do not use browser-default focus rings without refinement.
- Do not use default blue links.
- Do not use generic card grids.
- Do not use placeholder lorem ipsum.
- Do not use random icons from mixed sets.
- Do not overuse shadows.
- Do not make every surface white.
- Do not make every border visible.
- Do not use the same radius everywhere without judgment.
- Do not let Auxiliaire feel like an embedded support chat.
- Do not use generic AI sparkle icons as the brand language.
- Do not make Auxiliaire look like a customer-service bot.

## Suggested Design Tokens

These are directional names, not strict final values.

### Color Tokens

- `--color-canvas`
- `--color-surface`
- `--color-surface-soft`
- `--color-surface-ink`
- `--color-text-primary`
- `--color-text-secondary`
- `--color-text-muted`
- `--color-border-soft`
- `--color-accent-ready`
- `--color-accent-attention`
- `--color-accent-reflect`
- `--color-accent-info`

### Type Tokens

- `--font-ui`
- `--font-editorial`
- `--text-xs`
- `--text-sm`
- `--text-base`
- `--text-lg`
- `--text-xl`
- `--text-display`
- `--line-tight`
- `--line-normal`
- `--line-relaxed`

### Space Tokens

- `--space-1`
- `--space-2`
- `--space-3`
- `--space-4`
- `--space-6`
- `--space-8`
- `--space-12`
- `--space-16`

### Radius Tokens

- `--radius-sm`
- `--radius-md`
- `--radius-lg`
- `--radius-xl`

Use larger radius for capture surfaces and soft panels, smaller radius for buttons, rows, and controls.

## Example First Screen

The first screen should not be a marketing page. It should be the actual product.

Suggested content:

- A quiet top line: `Saturday, 13 June`
- Main state: `You are mostly clear. Two things need a decision.`
- Next action: `Finish the British Council note before opening new work.`
- Capture field: `Drop a thought, task, link, or question...`
- Briefing: what changed since last check.
- Open loops: only the items that matter.
- Auxiliaire panel: context-aware suggestions.
- Knowledge queue: items waiting to become notes or actions.

The user should feel oriented within five seconds.

## Final Standard

Auxiliaire should look and feel hand-designed. Nothing should appear accidental, default, or generated by a component library without taste. The interface should be simple, but not plain; calm, but not empty; intelligent, but not busy. It should make the user feel that their day, thoughts, knowledge, and unfinished work are being supported with care.
