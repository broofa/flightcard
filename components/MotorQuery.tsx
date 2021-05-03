import React, { useEffect, useState } from 'react';

/**
 *
 * Component for searching for motor info on ThrustCurve.org
 */
export default function MotorQuery() {
  const [motorQuery, setMotorQuery] = useState('');
  const [options, setOptions] = useState<string[]>([]);

  function handleMotorQuery(e) {
    setMotorQuery(e.target.value);
  }

  // Generat URL for querying thrustcurve.org for motor options
  const url = new URL('https://www.thrustcurve.org/api/v1/search.json?maxResults=20');

  const commonName = (/\b([a-o]\d+)/i.test(motorQuery)) && RegExp.$1.toUpperCase();
  if (commonName) { url.searchParams.set('commonName', commonName); }

  useEffect(() => {
    setOptions([]);
    if (!commonName) { return; }
    console.log(url.toString());
    fetch(url as any)
      .then(res => res?.json())
      .then(data => {
        const opts : string[] = [];

        for (const result of data?.results ?? []) {
          const { manufacturerAbbrev: mfr, designation, commonName } = result;
          const delays = result.delays?.split(',').filter(v => /^\d+$/.test(v));
          const prefix = `${mfr} ${designation || commonName}`;
          if (delays?.length) {
            for (const delay of delays) {
              opts.push(`${prefix}-${delay}`);
            }
          } else {
            opts.push(prefix);
          }
        }

        setOptions(opts);
      });
  }, [url.toString()]);

  return <>
    <input onChange={handleMotorQuery} list='motor-suggestions' value={motorQuery} />
    <datalist onClick={() => alert('click')} id='motor-suggestions'>
      {options.map((v, i) => <option key={i} value={v} />)}
    </datalist>
  </>;
}
