const conditionals = `
  float whenEqual(float x, float y) {
    return 1.0 - abs(sign(x - y));
  }

  float whenNotEqual(float x, float y) {
    return abs(sign(x - y));
  }

  float whenGreaterThan(float x, float y) {
    return max(sign(x - y), 0.0);
  }

  float whenLessThan(float x, float y) {
    return max(sign(y - x), 0.0);
  }

  float whenGreaterThanOrEqual(float x, float y) {
    return 1.0 - whenLessThan(x, y);
  }

  float whenLessThanOrEqual(float x, float y) {
    return 1.0 - whenGreaterThan(x, y);
  }

  float and(float a, float b) {
    return a * b;
  }

  float or(float a, float b) {
    return min(a + b, 1.0);
  }

  // float xor(float a, float b) {
  //   return (a + b) % 2.0;
  // }

  float not(float a) {
    return 1.0 - a;
  }
`;

export default conditionals;