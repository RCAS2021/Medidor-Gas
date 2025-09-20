const supabase = require('./supabase');

(async () => {
  const { data, error } = await supabase
    .from('apartment')
    .select('*');
  
  if (error) console.error('Erro no Supabase:', error);
  else console.log('Apartamentos:', data);
})();
