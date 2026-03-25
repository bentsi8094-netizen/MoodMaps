export const emoji_utils = {
  is_emoji: (str) => {
    if (!str || str === " ") return false;
    const emoji_regex = /\p{Extended_Pictographic}/u;
    const is_number = /^[0-9]+$/.test(str);
    return emoji_regex.test(str) && !is_number;
  },

  get_last_emoji: (str) => {
    if (!str) return null;
    const char_array = Array.from(str);
    for (let i = char_array.length - 1; i >= 0; i--) {
      if (emoji_utils.is_emoji(char_array[i])) {
        return char_array[i];
      }
    }
    return null;
  }
};