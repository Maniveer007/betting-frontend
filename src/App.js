// App.jsx
import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import logo from './logo.svg';
import './App.css';
import Bettingabi from './Betting.json';
import ERCabi from './ERC20.json';
import LoadingSpinner from './LoadingSpinner';

function App() {
  const [guilds, setGuilds] = useState([]);
  const [contract, setContract] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);
  const [open, setOpen] = useState(false);
  const [selectedGuild, setSelectedGuild] = useState(null);
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true); // New loading state

  async function loadData() {
    setLoading(true); // Start loading

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    if (!provider) {
      toast.error("Please install metamask");
      setLoading(false);
      return;
    } else {
      try {
        await provider.send("eth_requestAccounts", []);
      } catch (e) {
        toast.error("Please connect your metamask wallet");
        setLoading(false);
        return;
      }
    }

    window.ethereum.on("chainChanged", () => {
      window.location.reload();
    });
    window.ethereum.on("accountsChanged", () => {
      window.location.reload();
    });

    const network = await provider.getNetwork();
    if (network.chainId !== 0xaa36a7) {
      toast.error("Please switch to Sepolia network");
      setLoading(false);
      return;
    }

    const signer = provider.getSigner();
    const contract = new ethers.Contract("0xe74a2129Ae09E7D8Cb1815F1E6F000897fF939cb", Bettingabi, signer);
    const tokenContract = new ethers.Contract("0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8", ERCabi, signer);

    setContract(contract);
    setTokenContract(tokenContract);

    const address = await signer.getAddress();
    setAccount(address);

    const balance = await tokenContract.balanceOf(address);
    setBalance(ethers.utils.formatUnits(balance, 6));

    let index = 0;
    let loadGuilds = true;
    let guilds = [];
    while (loadGuilds) {
      try {
        const guildsIndex = await contract.Guilds(index++);
        console.log(guildsIndex);
        guilds.push(guildsIndex);
      } catch (e) {
        loadGuilds = false;
      }
    }
    setGuilds(guilds);
    setLoading(false); // End loading
  }

  async function handleSubmit() {
    toast.info("Placing bet on guild");
    const amount = document.getElementById('amount').value * 10 ** 6;
    try {
      const allowance = await tokenContract.allowance(account, contract.address);
      if (allowance < amount) {
        toast.info(`Approving ${amount - allowance} Tokens contract to spend tokens`);
        setLoading(true);
        const tx = await tokenContract.approve(contract.address, amount - allowance);
        await tx.wait();
        toast.success("Approved successfully");
        setLoading(false);
      }
      try {
        setLoading(true);
        const tx = await contract.placeBidOnGuild(selectedGuild[0], amount);
        await tx.wait();
        toast.success("Bet placed successfully");
        setLoading(false);
      } catch (error) {
        setLoading(false);
        toast.error(error.message);
      }
    } catch (e) {
      setLoading(false);
      toast.error(e.message);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <>
      {loading && <LoadingSpinner />} {/* Display loading spinner when loading */}
      <div className='balance-container'>
        Balance: {balance} Tokens
      </div>
      <div className='container'>
        {guilds.map((guild, index) => (
          <div
            onClick={() => {
              setSelectedGuild(guild);
              setOpen(true);
            }}
            className={`box ${selectedGuild && selectedGuild[0] === guild[0] ? 'selected' : ''}`}
            key={index}
          >
            {"GuildID:" + Number(guild[0]) + "\n \nGuildname:" + guild[1]}
          </div>
        ))}
      </div>

      {open && selectedGuild && (
        <div className="form-container">
          <p>Selected Guild ID: {Number(selectedGuild[0])}</p>
          <input type="number" id="amount" placeholder="Enter amount" />
          <button onClick={handleSubmit}>Place bet</button>
        </div>
      )}
      <ToastContainer />
    </>
  );
}

export default App;
