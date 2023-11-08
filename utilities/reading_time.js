function calculateReadingTime(content) {
    const wordsPerMinute = 238;
    const words = content.split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  }
  module.exports = {calculateReadingTime}