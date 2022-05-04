import React, { useState } from 'react';
import * as rax from 'retry-axios';
import axios from 'axios';

function DnsCheck() {
	const serverLocations = ['US', 'AU', 'NZ', 'UK'];
  	const [serverResultsUS, setServerResultsUS] = useState(null);
	const [serverResultsAU, setServerResultsAU] = useState(null);
	const [serverResultsNZ, setServerResultsNZ] = useState(null);
	const [serverResultsUK, setServerResultsUK] = useState(null);
	let dname = React.useRef();
	let recordtype = React.useRef();

	const dnsStatusResults = async (e) => {
		e.preventDefault();
		//reinitialize the UI before each new query
		setServerResultsUS({"zone":"USA"});
		setServerResultsAU({"zone":"AU"});
		setServerResultsNZ({"zone":"NZ"});
		setServerResultsUK({"zone":"UK"});
		//fetch DNS lookup data for each geographical location
		for (let index = 0; index < serverLocations.length; ++index) {
			const lookupInstance = axios.create();
			lookupInstance.defaults.raxConfig = {
				instance: lookupInstance,
				retry: 3,
				onRetryAttempt: err => {
					const cfg = rax.getConfig(err);
      				console.log(`Retry attempt #${cfg.currentRetryAttempt}`);
    			}
			};
			const interceptorId = rax.attach(lookupInstance);
			const res = await lookupInstance
				.get('https://dns.decodist.io/dns?domain='+dname.current.value+'&type='+recordtype.current.value+'&loc='+serverLocations[index], {timeout: 2000})
				.then((api) => {
					//handle error conditions in the DNS lookup result
					console.log(api.data);
					if (api.data.answer.errno) {
						api.data.answer[0] = 'No '+recordtype.current.value+' record';
					}
					switch (serverLocations[index]) {
						case 'US':
							setServerResultsUS(api.data);
							break;
						case 'AU':
							setServerResultsAU(api.data);
							break;
						case 'NZ':
							setServerResultsNZ(api.data);
							break;
						case 'UK':
							setServerResultsUK(api.data);
							break;
						default:
							break;
					}
				})
				.catch((err) => {
					//perform re-styling when a location times out or experiences an error
					//let errorLocation = document.querySelector('#'+serverLocations[index]);
					//let errorMessage = document.querySelector('#'+serverLocations[index]+' .card-inner');
					setServerResultsUS({"zone":serverLocations[index],"error":"1"});
			});
		}
	}

	//reusable component for the DNS lookup result cards
	const ResultCard = ({ zone, answer, location, provider, error }) => {
  		return (
			  <div className='item-container'>
					<div className='card' id={zone} key={zone}>
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
			<h1>DNS Propagation Tool...</h1>
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
			{serverResultsNZ &&
				<ResultCard zone={serverResultsNZ.zone} answer={serverResultsNZ.answer} location={serverResultsNZ.location} provider={serverResultsNZ.provider} error={serverResultsNZ.error} />
			}
			{serverResultsUS &&
				<ResultCard zone={serverResultsUS.zone} answer={serverResultsUS.answer} location={serverResultsUS.location} provider={serverResultsUS.provider} error={serverResultsUS.error} />
			}
			{serverResultsAU &&
				<ResultCard zone={serverResultsAU.zone} answer={serverResultsAU.answer} location={serverResultsAU.location} provider={serverResultsAU.provider} error={serverResultsAU.error} />
			}
			{serverResultsUK &&
				<ResultCard zone={serverResultsUK.zone} answer={serverResultsUK.answer} location={serverResultsUK.location} provider={serverResultsUK.provider} error={serverResultsUK.error} />
			}
			</div>
		</div>
	  );
}

export default DnsCheck;
