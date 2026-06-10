---
"@sanity-labs/sanity-plugin-workflows": minor
---

Fix workflow field wrappers hiding unrelated UI by mutating parent DOM

The `status`, `assignments`, and `statuses` field wrappers previously set `display: none` on their parent DOM element via a `useEffect`. When these fields rendered outside the document form (for example in the Studio's compare versions tool), the parent was a shared layout container, so entire panes were blanked out — and the inline style persisted even after the component unmounted.

The wrappers now use React's `<Activity>` component to hide their own subtree instead, which never touches DOM outside the component and pauses effects of hidden content. Fields are also hidden while the workflow lookup is in flight, removing the flash where inputs briefly appeared and then disappeared when opening a document without a workflow.

Note: the `react` peer dependency is now `^19.2`, since `<Activity>` shipped in React 19.2.
