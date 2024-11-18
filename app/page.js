'use client'

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CloudDownload, CloudUpload, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from "react";
import { extractBankTransactions } from "@/utils/actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import * as XLSX from 'xlsx'

export default function Home() {

  const [transactions, setTransactions] = useState([])

  const { toast } = useToast()
  const { register, handleSubmit, reset } = useForm()

  const queryClient = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: (formData) => extractBankTransactions(formData),
    onSuccess: (data) => {
      if (!data) {
        toast({
          variant: "destructive",
          description: 'Valami hiba történt...',
        });
        return;
      }
      setTransactions((prevData) => [
        ...prevData,
        ...data
      ]);
      toast({ description: "A tranzakciókat sikerült kinyerni." })
      reset()
    },
  });

  const onSubmit = (data) => {

    console.log("cliens");
    if (!data.bank_statement[0]) {
      toast({
        description: 'Kérlek válassz egy fájlt!',
      });
      return;
    }
    const formData = new FormData();
    formData.append('bank_statement', data.bank_statement[0])
    mutate({ formData });
  }

  const handleExportXLSX = async (transactions) => {
    // const workbook = XLSX.utils.book_new()
    // const worksheet = XLSX.utils?.json_to_sheet(transactions)
    // XLSX.utils.book_append_sheet(workbook, worksheet, "teszt")
    // XLSX.writeFile(workbook, `${"teszt"}.xlsx`);
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils?.json_to_sheet(transactions)
    XLSX.utils.book_append_sheet(workbook, worksheet, "bank_statements")
    XLSX.writeFile(workbook, `${"trium_bankstatements"}.xlsx`)
  }

  const deleteTransactions = () => {
    setTransactions([])
  }

  return (
    <div className="flex flex-col items-center gap-4 py-10">
      <div className="w-4/5">
        <Card className="bg-gray-50 border-none flex justify-between items-center">
          <CardHeader>
            <CardTitle>
              Bankszámlakivonat feltöltés
            </CardTitle>
          </CardHeader>
          <CardContent className="flex m-0 p-0 gap-4">
            <form onSubmit={handleSubmit(onSubmit)} className="flex gap-4 m-0 p-0">
              <Input
                type="file"
                id="bank_statement"
                name="bank_statement"
                placeholder="Fájl kiválasztása..."
                required
                accept="application/pdf"
                {...register("bank_statement")}
              />
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="animate-spin" /> : <CloudUpload />} Feltöltés
              </Button>
            </form>
            <Button disabled={transactions.length === 0} onClick={deleteTransactions}>
              <Trash2 /> Törlés
            </Button>
          </CardContent>
          <CardFooter className="px-4 py-0">
            <Button disabled={transactions.length === 0} onClick={() => handleExportXLSX(transactions)}>
              <CloudDownload /> XLSX export
            </Button>
          </CardFooter>
        </Card>
      </div>
      {transactions.length === 0 && <div className="w-full mx-auto p-4">
        <p className="text-center">Nincsenek tranzakciók importálva</p>
      </div>}
      {transactions.length !== 0 && <div className=" w-4/5 ">
        <Table className="">
          <TableHeader>
            <TableRow className="p-1 m-0">
              <TableHead className="py-1 px-2 m-0">Kivonat száma</TableHead>
              <TableHead className="py-1 px-2 m-0">Értéknap</TableHead>
              <TableHead className="py-1 px-2 m-0">Tranzakció adatai</TableHead>
              <TableHead className="py-1 px-2 m-0">Összeg</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {
              transactions.map((transactions, index) => {
                return (<TableRow key={index} className="p-1 m-0">
                  <TableCell className="py-1 px-2 m-0">{transactions.statementNumber}</TableCell>
                  <TableCell className="py-1 px-2 m-0">{transactions.date}</TableCell>
                  <TableCell className="py-1 px-2 m-0">{transactions.notes}</TableCell>
                  <TableCell className="py-1 px-2 m-0 text-right">{Intl.NumberFormat("no").format(transactions.amount)}</TableCell>
                </TableRow>)
              })
            }
          </TableBody>
        </Table>
      </div>}
    </div>
  );
}
