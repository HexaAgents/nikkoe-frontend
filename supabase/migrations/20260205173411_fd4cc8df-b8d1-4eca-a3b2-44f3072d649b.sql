-- Allow authenticated users to read channels
CREATE POLICY "channels_read_auth"
ON public.channels
FOR SELECT
USING (true);

-- Allow authenticated users to manage channels
CREATE POLICY "channels_insert_auth"
ON public.channels
FOR INSERT
WITH CHECK (true);

CREATE POLICY "channels_update_auth"
ON public.channels
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "channels_delete_auth"
ON public.channels
FOR DELETE
USING (true);