# Grid System Usage Guide

## Grid Structure
- **4 rows** (0-25%, 25-50%, 50-75%, 75-100%)
- **8 columns** (each 12.5% / 1/8 of width)
- Grid is positioned inside a box that's 1rem from all edges

## How to Use

### Step 1: Add the Grid Container
Wrap your grid content in a container:

```html
<div class="grid-container">
    <!-- Your grid items go here -->
</div>
```

### Step 2: Position Grid Items

#### Method 1: Using Utility Classes (Recommended)

**Example 1: Picture in bottom right quadrant (4 squares = columns 5-8, rows 3-4)**

```html
<div class="grid-container">
    <div class="grid-item grid-row-3 grid-col-5 grid-col-span-4 grid-row-span-2">
        <img src="your-image.jpg" style="width: 100%; height: 100%; object-fit: cover;">
    </div>
</div>
```

**Example 2: Text in row 2, column 5, aligned top-right**

```html
<div class="grid-container">
    <div class="grid-item grid-row-2 grid-col-5 grid-col-span-1 grid-row-span-1" style="position: relative;">
        <div class="grid-align-top-right grid-padding">
            <p>Your text here</p>
        </div>
    </div>
</div>
```

#### Method 2: Using Predefined Classes

**Bottom right quadrant:**
```html
<div class="grid-container">
    <div class="grid-item grid-bottom-right-quadrant">
        <img src="your-image.jpg" style="width: 100%; height: 100%; object-fit: cover;">
    </div>
</div>
```

**Specific cell (row 2, column 5):**
```html
<div class="grid-container">
    <div class="grid-item grid-cell-2-5" style="position: relative;">
        <div class="grid-align-top-right grid-padding">
            <p>Your text here</p>
        </div>
    </div>
</div>
```

### Utility Classes Reference

#### Positioning
- `.grid-row-1` through `.grid-row-4` - Position at start of row
- `.grid-col-1` through `.grid-col-8` - Position at start of column

#### Sizing
- `.grid-row-span-1` through `.grid-row-span-4` - Height (rows to span)
- `.grid-col-span-1` through `.grid-col-span-8` - Width (columns to span)

#### Alignment (use inside a positioned grid-item)
- `.grid-align-top-left`
- `.grid-align-top-right`
- `.grid-align-top-center`
- `.grid-align-bottom-left`
- `.grid-align-bottom-right`
- `.grid-align-bottom-center`
- `.grid-align-middle-left`
- `.grid-align-middle-right`
- `.grid-align-center`

### Tips

1. **Always wrap in `.grid-container`** - This positions the container inside the 1rem inset box
2. **Use `.grid-item`** - This enables pointer events for interactive content
3. **For alignment**, make the grid-item `position: relative` and place alignment classes on child elements
4. **Use `.grid-padding`** - Optional padding for content inside cells

### Grid Coordinates Reference

**Rows:**
- Row 1: 0% - 25%
- Row 2: 25% - 50%
- Row 3: 50% - 75%
- Row 4: 75% - 100%

**Columns:**
- Column 1: 0% - 12.5%
- Column 2: 12.5% - 25%
- Column 3: 25% - 37.5%
- Column 4: 37.5% - 50%
- Column 5: 50% - 62.5%
- Column 6: 62.5% - 75%
- Column 7: 75% - 87.5%
- Column 8: 87.5% - 100%

