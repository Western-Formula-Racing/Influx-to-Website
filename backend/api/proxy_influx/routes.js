// routes.js

export async function POST(request) {
    try {
        const body = await request.text();
        const influxResponse = await fetch(
            `${import.meta.env.VITE_INFLUX_URL}/api/v2/query?org=${import.meta.env.VITE_INFLUX_ORG}`, // Use INFLUX_ORG here
            {
                method: 'POST',
                headers: {
                    Authorization: `Token ${import.meta.env.VITE_INFLUX_TOKEN}`,
                    'Content-Type': 'application/vnd.flux',
                    Accept: 'application/csv'
                },
                body: body,
            }
        );

        if (!influxResponse.ok) {
            return new Response(`InfluxDB query error: ${influxResponse.statusText}`, {
                status: influxResponse.status
            });
        }
        const csvData = await influxResponse.text();
        return new Response(csvData, {status: 200});
    } catch (error) {
        return new Response(JSON.stringify({error: error.toString()}), {status: 500});
    }
}

