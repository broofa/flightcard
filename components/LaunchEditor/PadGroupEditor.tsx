import React, { HTMLAttributes } from 'react';
import { Button } from 'react-bootstrap';
import { util } from '/rt';
import { PADS_PATH, PAD_PATH } from '/rt/rtconstants';
import { iPads } from '/types';
export function PadGroupEditor({
  launchId,
  padGroup: groupName,
  ...props
}: { launchId: string; padGroup?: string } & HTMLAttributes<HTMLDivElement>) {
  const [editing, setEditing] = React.useState(false);
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
          if (pad.group !== groupName) return;

          pad.group = newName?.trim();
          return await util.set(
            PAD_PATH.with({ launchId, padId: pad.id }),
            pad
          );
        })
      );
    }

    setEditing(false);
  }

  return (
    <div
      className='d-grid mb-3 align-items-stretch'
      style={{ gridTemplateColumns: '15em 5em' }}
      {...props}
    >
      {editing ? (
        <>
          <input
            autoFocus
            type='text'
            className='h3 me-2'
            value={newName}
            onChange={e => setNewName(e.target.value)}
          />
          <Button size='sm' className='my-2' onClick={onSave}>
            Save
          </Button>
        </>
      ) : (
        <>
          <div className='h3 me-3'>{groupName}</div>
          <Button
            variant='outline-secondary'
            className='p-0 my-2'
            onClick={() => setEditing(true)}
          >
            Rename
          </Button>
        </>
      )}
    </div>
  );
}
