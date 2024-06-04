import axios from "axios";

/**
 * An axios instance that does not use a proxy.
 */
const client = axios.create({
    proxy: false,
});

export default client;
