---
'@sanity-labs/sanity-plugin-workflows': patch
---

Improve the default assignment object experience in Studio.

Assignment previews now resolve project member display names and avatars from project access data
instead of only showing the raw assigned user id. The assignment type input now falls back to the
default string input when workflow role options are unavailable, avoiding a blank or broken role
selector in custom workflow setups.
