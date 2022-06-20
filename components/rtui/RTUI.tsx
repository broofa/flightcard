// RTUI = RealTime UI for Controls that connect to the realtime DB
import { nanoid } from 'nanoid';
import React, {
  InputHTMLAttributes,
  ReactElement,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { Form, FormCheckProps } from 'react-bootstrap';
import { sig } from '../common/util';
import {
  BOOL_ADAPTER,
  DELETE,
  RTAdapter,
  RTPath,
  STRING_ADAPTER,
  util,
} from '/firebase';
import { MKS, tUnitSystem, unitConvert, unitParse } from '/util/units';

// ALL THE HOOKZ for RTUI controls
function useRealtimeField<RTType, ControlType>(
  path: RTPath,
  defaultValue: ControlType,
  adapter: RTAdapter<RTType, ControlType>
) {
  // Control value
  const [val, setVal] = useState(defaultValue);

  // Promise when value is being saved to the db
  const [saveAction, setSaveAction] = useState<Promise<void>>();

  // Identifier for connecting label and control
  const [id] = useState(nanoid());

  util.useSimpleValue<RTType>(
    path,
    useCallback((v?: RTType) => setVal(adapter.fromRT(v)), [adapter])
  );

  // Function to save current control value to db.  This also updates the
  // isSaving property used by controls to indicate the value is being saved.
  //
  // Calling with no args saves the current `val`, or pass an arg to explicitely
  // specify the RT value to save.
  function save(override?: ControlType) {
    const v = adapter.toRT(override ?? val);
    if (saveAction) return;
    const saving = util.set(path, v ?? DELETE);
    saving.finally(() => setSaveAction(undefined));
    setSaveAction(saving);
  }

  return { val, setVal, save, isSaving: !!saveAction, id };
}

export function rtuiFromPath(rtpath: RTPath, userUnits: tUnitSystem = MKS) {
  return {
    StringInput({
      label,
      field,
      className,
      ...props
    }: InputHTMLAttributes<HTMLInputElement> & {
      field: string;
      label: ReactElement | string;
    }) {
      const { val, setVal, save, isSaving, id } = useRealtimeField<
        string,
        string
      >(rtpath, '', STRING_ADAPTER);

      return (
        <div className='form-floating'>
          <input
            id={id}
            placeholder={id}
            value={String(val)}
            className={`form-control ${isSaving ? 'busy' : ''} ${
              className ?? ''
            }`}
            {...props}
            onChange={e => setVal(e.target.value)}
            onBlur={() => save()}
          />
          <label htmlFor={id}>{label}</label>
        </div>
      );
    },

    TextArea({
      label,
      field,
      className,
      ...props
    }: InputHTMLAttributes<HTMLTextAreaElement> & {
      field: string;
      label: ReactElement | string;
    }) {
      const { val, setVal, save, isSaving, id } = useRealtimeField<
        string,
        string
      >(fieldPath(field), '', STRING_ADAPTER);

      return (
        <div className='form-floating'>
          <textarea
            id={id}
            placeholder={id}
            value={val ?? ''}
            className={`form-control ${isSaving ? 'busy' : ''} ${
              className ?? ''
            }`}
            {...props}
            onChange={e => setVal(e.target.value)}
            onBlur={() => save()}
          />

          <label htmlFor={id}>{label}</label>
        </div>
      );
    },

    Check({
      field,
      ...props
    }: FormCheckProps & {
      field: string;
    }) {
      const { val, save, isSaving, id } = useRealtimeField<boolean, boolean>(
        fieldPath(field),
        false,
        BOOL_ADAPTER
      );

      return (
        <Form.Check
          id={id}
          placeholder={id}
          type='switch'
          checked={val ?? false}
          className={isSaving ? 'busy' : ''}
          {...props}
          onChange={e => {
            save(e.target.checked);
          }}
        />
      );
    },

    Radio({
      field,
      label,
      value,
      ...props
    }: FormCheckProps & {
      field: string;
      label: string;
      value: string;
    }) {
      const { val, save, isSaving, id } = useRealtimeField<string, string>(
        fieldPath(field),
        '',
        STRING_ADAPTER
      );

      return (
        <Form.Check
          id={id}
          placeholder={id}
          label={label}
          type='radio'
          checked={val === value}
          className={isSaving ? 'busy' : ''}
          {...props}
          onChange={() => save(value)}
        />
      );
    },

    UnitField({
      label,
      field,
      unitType,
      className,
      ...props
    }: InputHTMLAttributes<HTMLInputElement> & {
      field: string;
      label: ReactElement | string;
      unitType: keyof tUnitSystem;
    }) {
      const fromType = unitType == 'lengthSmall' ? 'length' : unitType;

      // Need to memoize the adapter because useRealtimeField's useEffect hook is
      // constrained by it
      const adapter = useMemo(() => {
        return {
          fromRT(v: number | undefined) {
            return String(
              sig(unitConvert(v as number, MKS[fromType], userUnits[unitType]))
            );
          },
          toRT(v: string) {
            return unitParse(v, userUnits[unitType], MKS[fromType]);
          },
        };
      }, [unitType, fromType]);

      const { val, setVal, save, isSaving, id } = useRealtimeField<
        number,
        string
      >(fieldPath(field), '', adapter);

      return (
        <div className='form-floating'>
          <input
            id={id}
            placeholder={id}
            value={val}
            className={`form-control ${isSaving ? 'busy' : ''} ${
              className ?? ''
            }`}
            {...props}
            onChange={e => {
              setVal(e.target.value);
            }}
            onBlur={() => save()}
          />
          <label htmlFor={id}>{label}</label>
        </div>
      );
    },
  };
}
