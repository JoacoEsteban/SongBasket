import electron from 'electron'
import { app, BrowserWindow, session } from 'electron'
import fetch from 'electron-fetch'
import {logme} from '../UTILS'

const localBackend = 'http://localhost:5000';
const herokuBackend = 'https://songbasket-backend.herokuapp.com';
const Backend = localBackend;

export async function fetchPlaylists(user_id, logged, SBID)
{
    let res = await fetch(`${Backend}/get_playlists?user_id=${user_id}&logged=${logged.toString()}&SBID=${SBID}`);
    let body = await res.text();
    return Promise.resolve(JSON.parse(body));
}