export const PERSONA_DETAILS: Record<
  string,
  { name: string; gender: "male" | "female"; description: string }
> = {
  strict: {
    name: "Alex",
    gender: "male",
    description: "Senior Staff Engineer - Strict & Technical",
  },
  friendly: {
    name: "Sarah",
    gender: "female",
    description: "Engineering Manager - Supportive & Encouraging",
  },
  system: {
    name: "James",
    gender: "male",
    description: "System Architect - Analytical & Detail-Oriented",
  },
};

export const BOILERPLATES: Record<string, string> = {
  javascript: `// JavaScript Solution
function solve(input) {
  // Write your solution here
  return input;
}

// Test
console.log(solve("Hello, World!"));
`,
  python: `# Python Solution
def solve(input_val):
    # Write your solution here
    return input_val

# Test
print(solve("Hello, World!"))
`,
  java: `public class Main {
    public static String solve(String input) {
        // Write your solution here
        return input;
    }

    public static void main(String[] args) {
        System.out.println(solve("Hello, World!"));
    }
}
`,
  cpp: `#include <iostream>
#include <string>
using namespace std;

string solve(string input) {
    // Write your solution here
    return input;
}

int main() {
    cout << solve("Hello, World!") << endl;
    return 0;
}
`,
  typescript: `// TypeScript Solution
function solve(input: string): string {
  // Write your solution here
  return input;
}

// Test
console.log(solve("Hello, World!"));
`,
};
