import React, { useState, useEffect } from 'react';
import * as rax from 'retry-axios';
import axios from 'axios';

function DnsCheck() {
	const [serverResults, setServerResults] = useState([]);
	/*
	useEffect(() => {
		console.log('serverResults='+JSON.stringify(serverResults));
	}, [serverResults]);
	*/
	function theLookup(index, zone, dname, recordtype, serverloc) {
		setServerResults([]);
		const theLookupResults = async (e) => {
			//setup axios
			const lookupInstance = axios.create();
			lookupInstance.defaults.raxConfig = {
				instance: lookupInstance,
				retry: 3,
				onRetryAttempt: err => {
					const cfg = rax.getConfig(err);
					//console.log(`Retry attempt #${cfg.currentRetryAttempt}`);
				}
			};
			const interceptorId = rax.attach(lookupInstance);
			const res = await lookupInstance
				.get('https://dns.decodist.io/dns?domain=' + dname + '&type=' + recordtype + '&loc=' + serverloc, {timeout: 1500})
				.then((api) => {
					//handle error conditions in the DNS lookup result
					//console.log(api.data);
					if (api.data.answer.errno) {
						api.data.answer[0] = 'No ' + recordtype + ' record';
					}
					//add countries to main collection
					let newData = {
						id: index,
						zone: zone,
						answer: api.data.answer,
						location: serverloc,
						provider: api.data.provider,
						error: ''
					};
					setServerResults(serverResults => [...serverResults, newData]);
				})
				.catch((err) => {
					let newData = {id: index, zone: zone, answer: '', location: '', provider: '', error: 'Oopsies'};
					setServerResults(serverResults => [...serverResults, newData]);
				});
		}
		theLookupResults().then();
	}

	const serverLocationsUnshuffled = ['US', 'AU', 'NZ', 'UK', 'JP', 'HK', 'TW'];
	let serverLocations = serverLocationsUnshuffled
		.map(value => ({ value, sort: Math.random() }))
		.sort((a, b) => a.sort - b.sort)
		.map(({ value }) => value);

	let dname = React.useRef();
	let recordtype = React.useRef();

	const dnsStatusResults = async (e) => {
		e.preventDefault();
		for (let index = 0; index < serverLocations.length; ++index) {
			theLookup(index, serverLocations[index], dname.current.value, recordtype.current.value, serverLocations[index]);
		}
	}

	//reusable component for the DNS lookup result cards
	const ResultCard = ({ zone, answer, location, provider, error }) => {
  		return (
			  <div className='item-container'>
					<div className='card' id={zone}>
						<h3>{zone}</h3>
						<div className='card-inner'>
						{answer &&
							<div className='answer-container'>
								<div className='answer'>
									<div>{answer[0]}</div>
									<div>{answer[1]}</div>
								</div>
								<div className='location'>Location: {location}</div>
								<div className='provider'>Provider: {provider}</div>
							</div>
						}
						{error &&
							<div className='answer-container'>
								<div className='answer'>
									<div>Oops</div>
								</div>
							</div>
						}
						</div>
					</div>
			</div>
		);
	};

	//render the UI and populate results
	return (
		<div>
			<h1>DNS Propagation Tool</h1>
			<h2>Enter a domain name to instantly check its DNS records around the world.</h2>
			<form onSubmit={dnsStatusResults}>
				<div className='formField'>
					Domain Name: <input type='text' ref={dname} />
				</div>
				<div className='formField'>
					Record Type:
					<select ref={recordtype}>
						<option value='A'>A</option>
						<option value='NS'>NS</option>
						<option value='MX'>MX</option>
					</select>
				</div>
				<div className='formField'>
					<button type="submit">Look it up</button>
				</div>
			</form>

			<div className='item-grid'>
				{serverResults.map(item => (
					<ResultCard key={item.zone+item.id} zone={item.zone} answer={item.answer} location={item.location} provider={item.provider} error={item.error} />
				))}
			</div>
		</div>
	);
}

export default DnsCheck;
