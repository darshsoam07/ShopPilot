import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteJson, getJson, patchJson, postJson } from '../../services/http';

export const addressUrl = '/api/v1/addresses';
const labels = {recipient_name:'Recipient name', phone:'Phone number', address_line1:'Street address', address_line2:'Address line 2', city:'City', state:'State', postal_code:'Postal code', country:'Country'};
type Field = keyof typeof labels;
export type Details = Partial<Record<Field,string>>;
export interface Address { id:number; details:Details; is_default:boolean }
export function useAddresses() {
  return useQuery({queryKey:['addresses'], queryFn:() => getJson<Address[]>(addressUrl)});
}
export function AddressesPage() {
  const list = useAddresses();
  const client = useQueryClient();
  const [editing,setEditing] = useState<number>();
  const [details,setDetails] = useState<Details>({country:'India'});
  const [primary,setPrimary] = useState(false);
  const change = useMutation({
    mutationFn: (operation: () => Promise<unknown>) => operation(),
    onSuccess: async () => {
      setEditing(undefined); setDetails({country:'India'}); setPrimary(false);
      await client.invalidateQueries({queryKey:['addresses']});
    }
  });
  function save() {
    const body = {details:Object.fromEntries(Object.entries(details).filter(([,v]) => v)),is_default:primary};
    change.mutate(() => editing ? patchJson(addressUrl+'/'+editing,body) : postJson(addressUrl,body));
  }
  return <section className="page-section"><h1>Address book</h1>
    {list.isPending && <p>Loading addresses…</p>}{list.isError && <p role="alert">{list.error.message}</p>}
    {list.data?.length === 0 && <p>No saved addresses.</p>}
    {list.data?.map(a => <article className="order-card" key={a.id}><address>{Object.values(a.details).filter(Boolean).join(', ')}</address>
      <div className="address-card-actions">
        {a.is_default ? <strong>Default address</strong> : <button disabled={change.isPending} onClick={() => change.mutate(() => patchJson(addressUrl+'/'+a.id,{is_default:true}))}>Set default</button>}
        <button onClick={() => {setEditing(a.id);setDetails(a.details);setPrimary(a.is_default);}}>Edit</button>
        <button disabled={change.isPending} onClick={() => {if(window.confirm('Delete this address?')) change.mutate(() => deleteJson(addressUrl+'/'+a.id));}}>Delete</button>
      </div>
    </article>)}
    <form className="checkout-panel" onSubmit={e=>{e.preventDefault();save();}}><h2>{editing ? 'Edit address' : 'Add address'}</h2>
      {(Object.keys(labels) as Field[]).map(key => <label key={key}>{labels[key]}<input required={!['state','address_line2'].includes(key)} value={details[key] ?? ''} onChange={e=>setDetails({...details,[key]:e.target.value})}/></label>)}
      <label><input type="checkbox" checked={primary} onChange={e=>setPrimary(e.target.checked)}/>Default address</label>
      <button disabled={change.isPending}>Save address</button></form>
    {change.isError && <p role="alert">{change.error.message}</p>}{change.isSuccess && <p role="status">Address book updated.</p>}
  </section>;
}
