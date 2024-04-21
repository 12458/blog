---
title: "Write-ups for Grey Cat the Flags CTF 2024"
date: 2024-04-21T14:46:00+0800
tags: ["writeups"]
author: "Shang En"
showToc: false
TocOpen: false
draft: false
hidemeta: false
comments: true
description: "I'm rusty..."
ShowBreadCrumbs: true
ShowPostNavLinks: true
ShowRssButtonInSectionTermList: true
UseHugoToc: true
---

## Verilog

We are asked to write a Verilog program for the Icarus Verilog simulator. We are not allowed to use conditionals (`if`, `else`) and addition (`+`) or ternary operators (`?`).

But we are allowed to use the subtraction (`-`) operator.

The predefined testbench setup requires us to have an input clock `clk` and output 32 bits.

### Solution

```verilog
module counter(
    input clk,
    output reg [31:0] result
);

    reg [31:0] next_count;

    initial begin
        result = 32'd0;
    end

    always @(posedge clk) begin
        result <= result - (-1);
    end

endmodule
```
