import type { InputHTMLAttributes } from 'react';

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
    label: string;
};

export function Field({ label, id, ...input }: FieldProps) {
    return (
        <p className="field">
            <label htmlFor={id}>{label}</label>
            <input id={id} {...input} />
        </p>
    );
}
