import { escapeHtml, sanitizeInput, isValidEmail } from "@/lib/sanitize";

describe("escapeHtml", () => {
  it("escapes < and >", () => {
    expect(escapeHtml("<script>alert('xss')</script>")).toBe(
      "&lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt;"
    );
  });

  it("escapes &", () => {
    expect(escapeHtml("a & b")).toBe("a &amp; b");
  });

  it("escapes double quotes", () => {
    expect(escapeHtml('"hello"')).toBe("&quot;hello&quot;");
  });

  it("escapes single quotes", () => {
    expect(escapeHtml("it's")).toBe("it&#039;s");
  });

  it("handles empty string", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("leaves normal text unchanged", () => {
    expect(escapeHtml("Hello World 123")).toBe("Hello World 123");
  });

  it("handles multiple entities in one string", () => {
    expect(escapeHtml('<a href="foo">bar & baz</a>')).toBe(
      '&lt;a href=&quot;foo&quot;&gt;bar &amp; baz&lt;/a&gt;'
    );
  });
});

describe("sanitizeInput", () => {
  it("strips HTML tags", () => {
    expect(sanitizeInput("<b>bold</b> text")).toBe("bold text");
  });

  it("strips script tags", () => {
    expect(sanitizeInput('<script>alert("xss")</script>normal')).toBe(
      'alert("xss")normal'
    );
  });

  it("trims whitespace", () => {
    expect(sanitizeInput("  hello  ")).toBe("hello");
  });

  it("respects max length", () => {
    expect(sanitizeInput("a".repeat(1000), 100)).toHaveLength(100);
  });

  it("defaults to 500 max length", () => {
    expect(sanitizeInput("a".repeat(600))).toHaveLength(500);
  });

  it("handles nested tags", () => {
    expect(sanitizeInput("<div><p>text</p></div>")).toBe("text");
  });

  it("handles self-closing tags", () => {
    expect(sanitizeInput("hello<br/>world")).toBe("helloworld");
  });
});

describe("isValidEmail", () => {
  it("accepts valid emails", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("user.name@domain.co.uk")).toBe(true);
    expect(isValidEmail("user+tag@example.com")).toBe(true);
  });

  it("rejects missing @", () => {
    expect(isValidEmail("userexample.com")).toBe(false);
  });

  it("rejects missing domain", () => {
    expect(isValidEmail("user@")).toBe(false);
  });

  it("rejects missing local part", () => {
    expect(isValidEmail("@example.com")).toBe(false);
  });

  it("rejects spaces", () => {
    expect(isValidEmail("user @example.com")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidEmail("")).toBe(false);
  });

  it("rejects multiple @", () => {
    expect(isValidEmail("user@@example.com")).toBe(false);
  });
});
