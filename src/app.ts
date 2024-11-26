// Utility function to clean and prepare input text
function prepareInput(text: string): string {
  return text
    .replace(/[ÁÀÂÄ]/g, "A")
    .replace(/[Č]/g, "C")
    .replace(/[Ď]/g, "D")
    .replace(/[ÉÈÊËĚ]/g, "E")
    .replace(/[ÍÌÎÏ]/g, "I")
    .replace(/[Ň]/g, "N")
    .replace(/[ÓÒÔÖ]/g, "O")
    .replace(/[Ř]/g, "R")
    .replace(/[Š]/g, "S")
    .replace(/[Ť]/g, "T")
    .replace(/[ÚÙÛÜŮ]/g, "U")
    .replace(/[Ý]/g, "Y")
    .replace(/[Ž]/g, "Z")
    .replace(/[áàâä]/g, "a")
    .replace(/[č]/g, "c")
    .replace(/[ď]/g, "d")
    .replace(/[éèêëě]/g, "e")
    .replace(/[íìîï]/g, "i")
    .replace(/[ň]/g, "n")
    .replace(/[óòôö]/g, "o")
    .replace(/[ř]/g, "r")
    .replace(/[š]/g, "s")
    .replace(/[ť]/g, "t")
    .replace(/[úùûüů]/g, "u")
    .replace(/[ý]/g, "y")
    .replace(/[ž]/g, "z")
    // .replace(/[^A-Z0-9]/g, "");
    .trim();
}

// Function greatest common divisor
function gcd(a: bigint, b: bigint): bigint {
  while (b !== BigInt(0)) {
    const temp = b;
    b = a % b;
    a = temp;
  }
  return a;
}

// Function modular multiplicative inverse using the Extended Euclidean Algorithm
function modInverse(e: bigint, phi: bigint): bigint {
  let [old_r, r] = [phi, e];
  let [old_s, s] = [BigInt(0), BigInt(1)];
  while (r !== BigInt(0)) {
    const quotient = old_r / r;
    [old_r, r] = [r, old_r - quotient * r];
    [old_s, s] = [s, old_s - quotient * s];
  }
  if (old_s < BigInt(0)) {
    old_s += phi;
  }
  return old_s;
}

// Function modular exponentiation
function modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
  if (modulus === BigInt(1)) return BigInt(0);
  let result = BigInt(1);
  base = base % modulus;
  while (exponent > BigInt(0)) {
    if (exponent % BigInt(2) === BigInt(1)) {
      result = (result * base) % modulus;
    }
    exponent = exponent / BigInt(2);
    base = (base * base) % modulus;
  }
  return result;
}

// Miller-Rabin
function isProbablyPrime(n: bigint, k = 5): boolean {
  if (n === BigInt(2) || n === BigInt(3)) return true;
  if (n <= BigInt(1) || n % BigInt(2) === BigInt(0)) return false;

  let s = BigInt(0);
  let d = n - BigInt(1);
  while (d % BigInt(2) === BigInt(0)) {
    d /= BigInt(2);
    s += BigInt(1);
  }

  WitnessLoop: for (let i = 0; i < k; i++) {
    const a =
      BigInt(2) + BigInt(Math.floor(Math.random() * Number(n - BigInt(4))));
    let x = modPow(a, d, n);
    if (x === BigInt(1) || x === n - BigInt(1)) continue;
    for (let r = BigInt(1); r < s; r++) {
      x = modPow(x, BigInt(2), n);
      if (x === BigInt(1)) return false;
      if (x === n - BigInt(1)) continue WitnessLoop;
    }
    return false;
  }
  return true;
}

// Function to generate a random prime number with y digits
function generateRandomPrime(y: number): bigint {
  const min = BigInt("1" + "0".repeat(y - 1));
  const max = BigInt("9".repeat(y));
  let p: bigint;
  do {
    p = min + BigInt(Math.floor(Math.random() * Number(max - min)));
    if (p % BigInt(2) === BigInt(0)) p += BigInt(1);
    while (p <= max && !isProbablyPrime(p)) {
      p += BigInt(2);
    }
  } while (p > max);
  return p;
}

// 1. Key Generation
function generateKeys(y: number) {
  const p = generateRandomPrime(y);
  let q: bigint;
  do {
    q = generateRandomPrime(y);
  } while (q === p);

  // Formula for RSA
  const n = p * q;
  // Eulers function
  const phi = (p - BigInt(1)) * (q - BigInt(1));

  let e = BigInt(65537); // Common choice for e Fermat prime number 12^6 + 1

  if (gcd(e, phi) !== BigInt(1)) {
    // Find a suitable e
    e = BigInt(3);
    while (e < phi && gcd(e, phi) !== BigInt(1)) {
      e += BigInt(2);
    }
  }
  // Modular multiplicative inverse
  const d = modInverse(e, phi);

  const publicKey = { n, e };
  const privateKey = { n, d };
  return { publicKey, privateKey };
}

// 2. Text to Numeric Conversion
function textToNumeric(text: string, X: number, z: number): bigint[] {
  const blocks: bigint[] = [];
  for (let i = 0; i < text.length; i += z) {
    let blockBinary = "";
    for (let j = 0; j < z; j++) {
      if (i + j < text.length) {
        let charCode = text.charCodeAt(i + j);
        let charBinary = charCode.toString(2).padStart(X, "0");
        blockBinary += charBinary;
      } else {
        // Pad with zeros if the last block is incomplete
        blockBinary += "0".repeat(X);
      }
    }
    blocks.push(BigInt("0b" + blockBinary));
  }
  return blocks;
}

// 3. Encryption
function encrypt(
  blocks: bigint[],
  publicKey: { n: bigint; e: bigint }
): bigint[] {
  const { n, e } = publicKey;
  return blocks.map((block) => modPow(block, e, n));
}

// 4. Decryption
function decrypt(
  cipherBlocks: bigint[],
  privateKey: { n: bigint; d: bigint }
): bigint[] {
  const { n, d } = privateKey;
  return cipherBlocks.map((block) => modPow(block, d, n));
}

// 5. Numeric to Text Conversion
function numericToText(blocks: bigint[], X: number, z: number): string {
  let text = "";
  for (const block of blocks) {
    let blockBinary = block.toString(2).padStart(X * z, "0");
    for (let i = 0; i < X * z; i += X) {
      const charBinary = blockBinary.slice(i, i + X);
      const charCode = parseInt(charBinary, 2);
      if (charCode !== 0) {
        text += String.fromCharCode(charCode);
      }
    }
  }
  return text;
}

// const inputText = "Útok na Čeňka v 19:00 @#&*)$^@#^&*($@#^&*(ok";
// const originalText = prepareInput(inputText); 

// const { publicKey, privateKey } = generateKeys(y);

// const numericBlocks = textToNumeric(originalText, X, z);

// const cipherBlocks = encrypt(numericBlocks, publicKey);

// const decryptedBlocks = decrypt(cipherBlocks, privateKey);

// const decryptedText = numericToText(decryptedBlocks, X, z);

// console.log("Original Text:", originalText);
// console.log("Encrypted Blocks:", cipherBlocks);
// console.log("Decrypted Text:", decryptedText);

// Parameters
// const y = 13; // Number of digits for primes p and q
// const x = 11; // Number of bits per character
// const z = 6; // Block size

// DOM Elements
const textInput = document.getElementById("text-input") as HTMLTextAreaElement;
const encryptionN = document.getElementById("encryption-n") as HTMLInputElement;
const encryptionE = document.getElementById("encryption-e") as HTMLInputElement;
const decryptionN = document.getElementById("decryption-n") as HTMLInputElement;
const decryptionD = document.getElementById("decryption-d") as HTMLInputElement;
const toggleMode = document.getElementById("encrypt-decrypt-toggle") as HTMLSelectElement;
const processButton = document.getElementById("process-button") as HTMLButtonElement;
const outputField = document.getElementById("output") as HTMLTextAreaElement;
const generateKeysButton = document.getElementById("generate-keys") as HTMLButtonElement;
const publicKeyDisplay = document.getElementById("public-key") as HTMLSpanElement;
const privateKeyDisplay = document.getElementById("private-key") as HTMLSpanElement;
const exampleButton = document.getElementById("example-button") as HTMLButtonElement;

// Generate Keys
generateKeysButton.addEventListener("click", () => {
  const keySize = 13;
  const { publicKey, privateKey } = generateKeys(keySize);

  publicKeyDisplay.textContent = `(${publicKey.n}, ${publicKey.e})`;
  privateKeyDisplay.textContent = `(${privateKey.n}, ${privateKey.d})`;

  encryptionN.value = publicKey.n.toString();
  encryptionE.value = publicKey.e.toString();
  decryptionN.value = privateKey.n.toString();
  decryptionD.value = privateKey.d.toString();
});

processButton.addEventListener("click", () => {
  const inputText = textInput.value;
  const mode = toggleMode.value;

  if (mode === "encrypt") {
    const n = BigInt(encryptionN.value);
    const e = BigInt(encryptionE.value);
    const publicKey = { n, e };

    const preparedText = prepareInput(inputText);
    const blocks = textToNumeric(preparedText, 8, 6);
    const cipherBlocks = encrypt(blocks, publicKey);

    outputField.value = cipherBlocks.map((block) => block.toString()).join(" ");
  } 
  else if (mode === "decrypt") {
    const n = BigInt(decryptionN.value);
    const d = BigInt(decryptionD.value);
    const privateKey = { n, d };

    const cipherBlocks = textInput.value.split(" ").map((block) => BigInt(block));
    const decryptedBlocks = decrypt(cipherBlocks, privateKey);
    const decryptedText = numericToText(decryptedBlocks, 8, 6);

    outputField.value = decryptedText;
  } else {
    outputField.value = "Invalid mode selected!";
  }
});

exampleButton.addEventListener("click", () => {
  textInput.value = "Útok na Čeňka v 19:00 @#&*)$^@#^&*($@#^&*(ok.";
})
