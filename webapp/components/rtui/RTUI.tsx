// RTUI = RealTime UI for Controls that connect to the realtime DB
import {
  type HTMLProps,
  type InputHTMLAttributes,
  type ReactElement,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { Form, type FormCheckProps } from 'react-bootstrap';
import { cn, randomId, sig } from '../common/util';
import { DELETE, rtSet, useRTValue } from '/rt';
import type { RTPath } from '/rt/RTPath';
import { MKS, type tUnitSystem, unitConvert, unitParse } from '/util/units';

// Adapter for converting values between DB and control types
type RTAdapter<RTType, ControlType> = {
  toRT: (value: ControlType) => RTType | undefined;
  fromRT: (value: RTType | undefined) => ControlType;
};

//
// Useful RT adapters.  Specifying these here avoids having to memoize them.
//

export const STRING_ADAPTER: RTAdapter<string, string> = {
  fromRT(v) {
    return v ?? '';
  },
  toRT(v) {
    return v.trim() || DELETE;
  },
};

export const BOOL_ADAPTER: RTAdapter<boolean, boolean> = {
  fromRT(v) {
    return !!v;
  },
  toRT(v) {
    return v ? true : DELETE;
  },
};

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
  const [id] = useState(randomId());

  useRTValue<RTType>(
    path,
    useCallback((v?: RTType) => setVal(adapter.fromRT(v)), [adapter])
  );

  // Function to save current control value to db.  This also updates the
  // isSaving property used by controls to indicate the value is being saved.
  //
  // Calling with no args saves the current `val`, or pass an arg to explicitely
  // specify the RT value to save.
  function save(override?: ControlType) {
    if (saveAction) return;
    const v = adapter.toRT(override ?? val);
    setVal(adapter.fromRT(v));
    const saving = rtSet(path, v ?? DELETE);
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
      >(rtpath.append(field, {}), '', STRING_ADAPTER);

      return (
        <div className={cn(className, 'form-floating')}>
          <input
            id={id}
            placeholder={id}
            value={String(val)}
            className={`form-control ${isSaving ? 'busy' : ''} ${
              className ?? ''
            }`}
            {...props}
            onChange={(e) => setVal(e.target.value)}
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
      >(rtpath.append(field, {}), '', STRING_ADAPTER);

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
            onChange={(e) => setVal(e.target.value)}
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
        rtpath.append(field, {}),
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
          onChange={(e) => {
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
        rtpath.append(field, {}),
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

    Select({
      field,
      label,
      children,
      ...props
    }: HTMLProps<HTMLSelectElement> & {
      field: string;
      label: string;
    }) {
      const { val, save, isSaving, id } = useRealtimeField<string, string>(
        rtpath.append(field, {}),
        '',
        STRING_ADAPTER
      );

      return (
        <div className='form-floating'>
          <select
            id={id}
            value={val}
            className={`form-select ${isSaving ? 'busy' : ''}`}
            {...props}
            onChange={(e) => save(e.target.value)}
          >
            {children}
          </select>

          <label htmlFor={id}>{label}</label>
        </div>
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
      const fromType = unitType === 'lengthSmall' ? 'length' : unitType;

      // Need to memoize the adapter because useRealtimeField's useEffect hook is
      // constrained by it
      const adapter = useMemo(() => {
        return {
          fromRT(v: number | undefined) {
            if ((v ?? 0) === 0) return '';
            return String(
              sig(unitConvert(v as number, MKS[fromType], userUnits[unitType]))
            );
          },
          toRT(v: string) {
            const val = unitParse(v, userUnits[unitType], MKS[fromType]);
            if (val === 0 || Number.isNaN(val)) return DELETE;
            return unitParse(v, userUnits[unitType], MKS[fromType]);
          },
        };
      }, [unitType, fromType]);

      const { val, setVal, save, isSaving, id } = useRealtimeField<
        number,
        string
      >(rtpath.append(field, {}), '', adapter);

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
            onChange={(e) => {
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
