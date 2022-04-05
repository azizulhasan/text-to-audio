import { createContext } from 'react';
const Context = createContext('Default Value');

<Context.Provider value={false}>
if(window.location.pathname !== '/dashboard'){
  <Front/>
}else{
  <Dashboard/>
}
</Context.Provider>
export default Context;