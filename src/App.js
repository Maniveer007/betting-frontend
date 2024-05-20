import logo from './logo.svg';
import './App.css';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import abi from './Betting.json'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  
  const [Guilds,setGuilds]=useState([]);
  const [contract,setContract]=useState(null);
  const [open,setOpen]=useState(false);

  async function loadData(){
    const provider=new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer=provider.getSigner();

    const address= await signer.getAddress();

    const contract=new ethers.Contract("0x954e099ea59AbfD7ae5d0A16ffd4CD72d0616DaA",abi,signer);
    let index=0;
    let loadguilds=true;
    let guilds=[];
    setContract(contract);
    while(loadguilds){
      try{
        const guildsindex=await contract.Guilds(index++);
        console.log(guildsindex);
        guilds.push(guildsindex);
      }catch(e){
        loadguilds=false;
      }
    }
    setGuilds(guilds);
  }

  async function handlesubmit(){
    toast.info("Placing bet on guild");
    const guildid=document.getElementById('guild-id').value;
    const amount=document.getElementById('amount').value;
    try{

      const tx=await contract.placeBidOnGuild(guildid,amount);
      await tx.wait();
      toast.success("Bet placed successfully");
    }catch(e){
      toast.error(e.message);
    }
  
  }
  
  useEffect(()=>{
    loadData();
  },[])
  return (<>
  <div className='container'> 
    {Guilds.map((guild,index)=>{
      return <div onClick={()=>{setOpen(!open)}} className="box" key={index}>{"GuildID:"+Number(guild[0])+"\n \nGuildname:"+guild[1]}</div>
    })}
    </div>

    
        {open && 
           <div className="form-container">
            <input type="number" id="guild-id" placeholder="enter guild id" />
            <input type="number" id="amount" placeholder="enter amount" />
            <button onClick={handlesubmit}>Placebet</button>
        </div>
        }
        <ToastContainer />

        </>);


}

export default App;
