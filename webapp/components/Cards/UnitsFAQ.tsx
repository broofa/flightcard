export default function UnitsFAQ() {
  return (
    <details className='bg-light rounded mb-2 px-2 flex-grow-1'>
      <summary className='text-tip flex-grow-1'>
        FAQ: How do I enter values with different units?
      </summary>

      <p className='mt-3'>Units may be specified as follows:</p>

      <dl
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: '.2em 1em',
        }}
      >
        {/* Length */}
        <div className='fw-normal text-end'>Length (metric)</div>
        <div>
          <code>1m</code>, <code>1cm</code>, <code>1mm</code>
        </div>

        <div className='fw-normal text-end'>Length (english)</div>
        <div>
          <code>1ft</code>, <code>1'</code>, <code>1in</code>, <code>1"</code>,{' '}
          <code>1'1"</code>, <code>1ft 1in</code>
        </div>

        <div className='fw-normal text-end'>Mass (metric)</div>
        <div>
          <code>1kg</code>, <code>1g</code>
        </div>

        <div className='fw-normal text-end'>Mass (english)</div>
        <div>
          <code>1lb</code>, <code>1oz</code>, <code>1lb 1oz</code>
        </div>

        <div className='fw-normal text-end'>Thrust/force (metric)</div>
        <div>
          <code>1n</code>
        </div>

        <div className='fw-normal text-end'>Thrust/force (english)</div>
        <div>
          <code>1lbf</code>
        </div>

        <div className='fw-normal text-end'>Impulse (metric)</div>
        <div>
          <code>1n-s</code>,&ensp;
          <code>1n-sec</code>
        </div>

        <div className='fw-normal text-end'>Impulse (english)</div>
        <div>
          <code>1lbf-s</code>,&ensp;
          <code>1lbf-sec</code>
        </div>
      </dl>
    </details>
  );
}
