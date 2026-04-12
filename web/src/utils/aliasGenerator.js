export const generate_alias = (first_name) => {
  if (!first_name) return "User" + Math.floor(1000 + Math.random() * 9000);

  const letters = ['x', 'z', 'm', 's', 'v', 'a', 'r', 'l'];
  const random_letter = letters[Math.floor(Math.random() * letters.length)];
  const random_num = Math.floor(10000 + Math.random() * 89999);
  
  const clean_prefix = first_name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0590-\u05FF]/g, '')
    .substring(0, 5); 
  
  return `${clean_prefix}${random_letter}${random_num}`;
};