---
"@yesid/ui": patch
---

`ReadingFrame` (Experimental) fills its parent again when it is a flex or grid item. Since
0.58.0-rc.1 the frame is an inline-size container, which leaves it no content width of its own, so
in a flex column or a grid, with centred items or not, it collapsed to its gutters and squeezed the
title, contents links and body into a column a few pixels wide. The frame now takes the width block
flow gives it, its parent's width less the gutters, up to the measure. It stays the `reading-frame`
container with the same large-text step-down, and frames in block flow keep the same geometry.
`--reading-gutter` takes one length or percentage; `--reading-gutter: 0` works as before. No props
change.
