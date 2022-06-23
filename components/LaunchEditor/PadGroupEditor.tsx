import React, { HTMLAttributes } from 'react';
import { util } from '/rt';
import { PADS_PATH, PAD_PATH } from '/rt/rtconstants';
import { iPads } from '/types';
export function PadGroupEditor({
  launchId,
  padGroup: groupName,
  ...props
}: { launchId: string; padGroup?: string } & HTMLAttributes<HTMLDivElement>) {
  const [newName, setNewName] = React.useState(groupName);

  const rtPath = PADS_PATH.with({ launchId });

  async function onSave() {
    if (newName?.trim() !== groupName?.trim()) {
      const pads = await util.get<iPads>(rtPath);

      // We have the realtime db set up to disallow bulk edits of the entire pads
      // collection for a launch, so we have to iterate through each one
      // individually
      await Promise.all(
        Object.values(pads).map(async pad => {
          if ((pad.group ?? '') !== groupName) return;

          pad.group = newName?.trim();
          return await util.set(
            PAD_PATH.with({ launchId, padId: pad.id }),
            pad
          );
        })
      );
    }
  }

  return (
    <div
      className='d-grid mb-2  align-items-stretch'
      style={{ width: '20em', gridTemplateColumns: '1fr 0fr' }}
      {...props}
    >
      <input
        autoFocus
        type='text'
        value={newName}
        placeholder='(default group)'
        onChange={e => setNewName(e.target.value)}
        onBlur={onSave}
      />
    </div>
  );
}
