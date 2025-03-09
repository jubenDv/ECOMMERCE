//Admin password hash generator
const bcrypt = require('bcrypt');
const password = 'adminadmin';

bcrypt.hash(password, 10, (err, hash) => {
  if (err) console.error(err);
  console.log('Hashed Password:', hash);
});
