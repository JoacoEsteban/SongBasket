import electron from 'electron'
import { app, BrowserWindow, session } from 'electron'
import fetch from 'electron-fetch'
import {logme} from '../UTILS'

const localBackend = 'http://localhost:5000';
const herokuBackend = 'https://songbasket-backend.herokuapp.com';
const Backend = localBackend;

export async function fetchPlaylists({user_id, logged, SBID, control})
{
    var limit = 20;
    let res = await fetch(`${Backend}/retrieve?user_id=${user_id}&logged=${logged.toString()}&SBID=${SBID}&limit=${limit}&offset=${control.offset}&retrieve=playlists`);
    let body = await res.text();
    return Promise.resolve(JSON.parse(body));
}

export async function getTracks({user_id, logged, SBID, control}, playlist_id)
{
    let res = await fetch(`${Backend}/retrieve?user_id=${user_id}&logged=${logged.toString()}&SBID=${SBID}&limit=100&offset=${control.offset}&retrieve=playlist_tracks&playlist_id=${playlist_id}`);
    let body = await res.text();
    return Promise.resolve(JSON.parse(body));

}